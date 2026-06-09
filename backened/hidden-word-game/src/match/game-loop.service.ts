import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { MatchService } from './match.service';
import { RoundService } from '../round/round.service';
import { PlayersService } from '../players/players.service';
import { GuessService } from '../guess/guess.service';

// --- Timing configuration (server is the single source of truth) ---
const TICK_DURATION_MS = 10000; // T: length of one tick window
const POST_ROUND_DELAY_MS = 5000; // brief pause between rounds
// After the first correct guess we wait a short grace period before ending the
// round. This window lets the opponent also submit a correct guess in the SAME
// tick, which the spec requires us to treat as a draw.
const RESOLUTION_GRACE_MS = 1500;
// If a player disconnects mid-match, the remaining player wins by forfeit once
// this grace period elapses without the disconnected player rejoining.
const DISCONNECT_GRACE_MS = 10000;

/**
 * Per-match runtime state held in memory while a match is being played.
 * This is intentionally NOT persisted — it is ephemeral coordination state for
 * the active tick window (the durable state lives in the DB via the services).
 */
interface MatchRuntime {
  tickTimer?: NodeJS.Timeout; // fires at the end of the current tick
  resolutionTimer?: NodeJS.Timeout; // fires after the first correct guess grace
  tickOpen: boolean; // are guesses currently accepted?
  resolving: boolean; // is the round already being finalised?
  roundId: string; // the round this tick belongs to
  guessedThisTick: Set<string>; // playerIds that already used their one guess
  correctGuessers: string[]; // playerIds (in arrival order) that were correct
}

@Injectable()
export class GameLoopService {
  private readonly logger = new Logger(GameLoopService.name);
  private runtimes = new Map<string, MatchRuntime>();
  // Pending forfeit timers keyed by matchId, used for disconnect resilience.
  private forfeitTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly matchService: MatchService,
    private readonly roundService: RoundService,
    private readonly playersService: PlayersService,
    private readonly guessService: GuessService,
  ) {}

  isLoopActive(matchId: string): boolean {
    return this.runtimes.has(matchId);
  }

  /** Start (or resume) the tick loop for a match. Idempotent. */
  async startLoop(matchId: string, server: Server) {
    if (this.runtimes.has(matchId)) return;

    const round = await this.roundService.getLatestRoundForMatch(matchId);
    if (!round || round.winnerId) return;

    this.runtimes.set(matchId, {
      tickOpen: false,
      resolving: false,
      roundId: round.id,
      guessedThisTick: new Set<string>(),
      correctGuessers: [],
    });

    this.logger.log(`Starting game loop for match ${matchId}`);
    void this.beginTick(matchId, server);
  }

  /** Tear down all timers for a match's tick loop. */
  stopLoop(matchId: string) {
    const runtime = this.runtimes.get(matchId);
    if (!runtime) return;
    if (runtime.tickTimer) clearTimeout(runtime.tickTimer);
    if (runtime.resolutionTimer) clearTimeout(runtime.resolutionTimer);
    this.runtimes.delete(matchId);
  }

  /**
   * Open a fresh tick window: reset per-tick guess tracking and broadcast
   * tickStart with everything the client needs to stay in sync (tick duration,
   * the authoritative revealed-tile mask, and the active roundId).
   *
   * NOTE: unlike the previous implementation, NO tile is revealed here. The
   * word stays fully hidden at the start and a tile is only revealed when a
   * tick EXPIRES with no correct guess (see handleTickExpiry), matching the
   * spec's "reveal one new letter per tick" semantics.
   */
  private async beginTick(matchId: string, server: Server) {
    const runtime = this.runtimes.get(matchId);
    if (!runtime) return;

    const round = await this.roundService.getLatestRoundForMatch(matchId);
    if (!round || round.winnerId) {
      this.stopLoop(matchId);
      return;
    }

    runtime.roundId = round.id;
    runtime.tickOpen = true;
    runtime.resolving = false;
    runtime.guessedThisTick.clear();
    runtime.correctGuessers = [];

    server.to(matchId).emit('tickStart', {
      roundId: round.id,
      wordLength: round.word.length,
      revealedTiles: round.revealedTiles,
      tickDuration: TICK_DURATION_MS,
    });

    runtime.tickTimer = setTimeout(
      () => void this.handleTickExpiry(matchId, server),
      TICK_DURATION_MS,
    );
  }

  /**
   * The tick timer expired with no correct guess. Close the window, reveal one
   * random unrevealed tile, then either start the next tick or end the round if
   * the whole word is now exposed.
   */
  private async handleTickExpiry(matchId: string, server: Server) {
    const runtime = this.runtimes.get(matchId);
    if (!runtime || runtime.resolving) return;

    runtime.tickOpen = false;
    server.to(matchId).emit('tickEnd', { roundId: runtime.roundId });

    const result = await this.roundService.revealRandomTile(runtime.roundId);

    // No tile left to reveal — the word is fully exposed and nobody guessed it.
    if (result.index === null) {
      await this.handleRoundEnd(matchId, null, server);
      return;
    }

    server.to(matchId).emit('revealTile', {
      index: result.index,
      letter: result.letter,
    });

    if (result.isFullyRevealed) {
      // That was the last tile and still no correct guess → no points awarded.
      await this.handleRoundEnd(matchId, null, server);
    } else {
      void this.beginTick(matchId, server);
    }
  }

  /**
   * Handle an incoming guess. Enforces all server-side guess rules:
   *  - only during an open tick window (else "late submission")
   *  - exactly one guess per player per tick (duplicates/spam ignored)
   *  - first correct guess wins, but a same-tick second correct guess draws
   */
  async processGuess(
    matchId: string,
    playerId: string,
    roundId: string | undefined,
    guess: string,
    client: Socket,
    server: Server,
  ) {
    const runtime = this.runtimes.get(matchId);

    // Reject submissions outside an active tick window (latency / between rounds).
    if (!runtime || !runtime.tickOpen) {
      client.emit('guessRejected', { reason: 'late submission' });
      return;
    }

    // Reject guesses that reference a stale round.
    if (roundId && roundId !== runtime.roundId) {
      client.emit('guessRejected', { reason: 'late submission' });
      return;
    }

    // Enforce a single guess per player per tick (ignore duplicates / malicious spam).
    if (runtime.guessedThisTick.has(playerId)) {
      client.emit('guessRejected', { reason: 'only one guess per tick' });
      return;
    }
    runtime.guessedThisTick.add(playerId);

    const round = await this.roundService.getLatestRoundForMatch(matchId);
    if (!round || round.id !== runtime.roundId) {
      client.emit('guessRejected', { reason: 'late submission' });
      return;
    }

    const isCorrect = guess.trim().toLowerCase() === round.word.toLowerCase();
    await this.guessService.createGuess(playerId, round.id, guess, isCorrect);
    client.emit('guessResult', { correct: isCorrect });

    if (!isCorrect) return;

    runtime.correctGuessers.push(playerId);

    // Freeze tile reveals while we resolve the round, but keep the window open
    // so the opponent can still produce a same-tick correct guess (→ draw).
    if (runtime.tickTimer) {
      clearTimeout(runtime.tickTimer);
      runtime.tickTimer = undefined;
    }

    if (runtime.correctGuessers.length >= 2) {
      // Both players correct in the same tick → draw, no points.
      if (runtime.resolutionTimer) clearTimeout(runtime.resolutionTimer);
      runtime.resolving = true;
      await this.handleRoundEnd(matchId, null, server);
      return;
    }

    // First correct guess: wait a short grace for a possible same-tick draw.
    runtime.resolutionTimer = setTimeout(() => {
      runtime.resolving = true;
      void this.handleRoundEnd(matchId, playerId, server);
    }, RESOLUTION_GRACE_MS);
  }

  /**
   * Finalise a round: persist the result, update scores, broadcast roundEnd,
   * and either schedule the next round or end the match.
   * winnerId === null means a draw / fully-revealed-no-guess (no points).
   */
  private async handleRoundEnd(
    matchId: string,
    winnerId: string | null,
    server: Server,
  ) {
    this.stopLoop(matchId);

    const round = await this.roundService.endRound(matchId, winnerId);
    const { updatedMatch, player1, player2 } =
      await this.matchService.updateScores(matchId, round.winnerId);

    const scores = {
      [player1.username]: updatedMatch.score1,
      [player2.username]: updatedMatch.score2,
    };

    const winner = winnerId
      ? await this.playersService.findOneById(winnerId)
      : null;

    server.to(matchId).emit('roundEnd', {
      winner: winner ? winner.username : null,
      revealedWord: round.word,
      scores,
    });

    if (updatedMatch.status === 'completed') {
      await this.emitMatchEnd(matchId, updatedMatch, player1, player2, server);
    } else {
      // Brief pause, then start a new round with a new word.
      setTimeout(
        () => void this.startNextRound(matchId, server),
        POST_ROUND_DELAY_MS,
      );
    }
  }

  private async startNextRound(matchId: string, server: Server) {
    try {
      const newRound = await this.roundService.startNewRound(matchId);
      server
        .to(matchId)
        .emit('nextRoundStarting', { wordLength: newRound.word.length });
      await this.startLoop(matchId, server);
    } catch (error) {
      this.logger.error(`Failed to start next round for ${matchId}`, error);
      server.to(matchId).emit('error', 'Failed to start the next round.');
    }
  }

  /** Broadcast the final matchEnd payload including draw handling + finalScores. */
  private async emitMatchEnd(
    matchId: string,
    match: { winnerId: string | null; score1: number; score2: number },
    player1: { username: string },
    player2: { username: string },
    server: Server,
  ) {
    const finalScores = {
      [player1.username]: match.score1,
      [player2.username]: match.score2,
    };

    let winnerName: string | null = 'draw';
    if (match.winnerId) {
      const finalWinner = await this.playersService.findOneById(match.winnerId);
      winnerName = finalWinner ? finalWinner.username : 'draw';
    }

    server.to(matchId).emit('matchEnd', { winner: winnerName, finalScores });
    this.clearForfeit(matchId);
  }

  // --- Disconnect resilience -------------------------------------------------

  /**
   * A player's socket dropped. Pause the loop and start a grace timer; if the
   * player does not rejoin in time, the remaining player wins by forfeit.
   */
  async handlePlayerDisconnect(
    matchId: string,
    disconnectedPlayerId: string,
    server: Server,
  ) {
    const match = await this.matchService.findOne(matchId);
    if (!match || match.status === 'completed') return;

    // Pause active ticks; the loop resumes if the player rejoins (see gateway).
    this.stopLoop(matchId);

    if (this.forfeitTimers.has(matchId)) return; // already counting down

    const remainingPlayerId =
      disconnectedPlayerId === match.player1Id
        ? match.player2Id
        : match.player1Id;

    this.logger.log(
      `Player ${disconnectedPlayerId} disconnected from ${matchId}; ` +
        `forfeit grace started.`,
    );

    const timer = setTimeout(() => {
      void this.awardForfeit(matchId, remainingPlayerId, server);
    }, DISCONNECT_GRACE_MS);

    this.forfeitTimers.set(matchId, timer);
  }

  /** Cancel a pending forfeit (called when a player rejoins in time). */
  clearForfeit(matchId: string) {
    const timer = this.forfeitTimers.get(matchId);
    if (timer) {
      clearTimeout(timer);
      this.forfeitTimers.delete(matchId);
    }
  }

  private async awardForfeit(
    matchId: string,
    winnerPlayerId: string,
    server: Server,
  ) {
    this.forfeitTimers.delete(matchId);
    this.stopLoop(matchId);

    try {
      const { match, winner, player1, player2 } =
        await this.matchService.forfeitMatch(matchId, winnerPlayerId);

      server.to(matchId).emit('matchEnd', {
        winner: winner.username,
        finalScores: {
          [player1.username]: match.score1,
          [player2.username]: match.score2,
        },
        reason: 'opponent disconnected',
      });
    } catch (error) {
      this.logger.error(`Failed to award forfeit for ${matchId}`, error);
    }
  }
}
