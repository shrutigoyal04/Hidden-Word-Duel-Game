import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { MatchService } from './match.service';
import { RoundService } from '../round/round.service';
import { PlayersService } from '../players/players.service';
import { GuessService } from '../guess/guess.service';

const TICK_INTERVAL_MS = 10000; // 10 seconds per tick
const POST_ROUND_DELAY_MS = 5000; // 5 seconds between rounds

@Injectable()
export class GameLoopService {
  private readonly logger = new Logger(GameLoopService.name);
  private activeLoops = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly matchService: MatchService,
    private readonly roundService: RoundService,
    private readonly playersService: PlayersService,
    private readonly guessService: GuessService,
  ) {}

  startLoop(matchId: string, server: Server) {
    if (this.activeLoops.has(matchId)) return;
    this.logger.log(`Starting game loop for match: ${matchId}`);
    
    // Start the first tick immediately without waiting
    this.executeTick(matchId, server);
    
    const interval = setInterval(() => this.executeTick(matchId, server), TICK_INTERVAL_MS);
    this.activeLoops.set(matchId, interval);
  }

  stopLoop(matchId: string) {
    if (this.activeLoops.has(matchId)) {
      this.logger.log(`Stopping game loop for match: ${matchId}`);
      clearInterval(this.activeLoops.get(matchId)!);
      this.activeLoops.delete(matchId);
    }
  }

  async processGuess(matchId: string, playerId: string, guess: string, server: Server) {
    const round = await this.roundService.getLatestRoundForMatch(matchId);
    if (!round || round.winnerId) return; // Round is already over

    const isCorrect = guess.toLowerCase() === round.word.toLowerCase();
    await this.guessService.createGuess(playerId, round.id, guess, isCorrect);

    if (isCorrect) {
      // Correct guess ends the round immediately
      await this.handleRoundEnd(matchId, playerId, server);
    }
  }

  private async executeTick(matchId: string, server: Server) {
    server.to(matchId).emit('tickStart');

    const round = await this.roundService.getLatestRoundForMatch(matchId);
    if (!round || round.winnerId) {
      this.stopLoop(matchId);
      return;
    }

    const result = await this.roundService.revealRandomTile(round.id);
    
    // This now correctly checks the flag from the service
    if (result.isFullyRevealed) {
      // All tiles revealed, round ends in a draw
      await this.handleRoundEnd(matchId, null, server);
    } else {
      // Emit the newly revealed tile
      server.to(matchId).emit('revealTile', { index: result.index, letter: result.letter });
    }
  }

  private async handleRoundEnd(matchId: string, winnerId: string | null, server: Server) {
    this.stopLoop(matchId);
    
    // CORRECT: Calling the new methods on the services
    const round = await this.roundService.endRound(matchId, winnerId);
    const { updatedMatch, player1, player2 } = await this.matchService.updateScores(matchId, round.winnerId);
    const scores = { [player1.username]: updatedMatch.score1, [player2.username]: updatedMatch.score2 };
    
    // The winner object is only needed for the username
    const winner = winnerId ? await this.playersService.findOneById(winnerId) : null;
    
    server.to(matchId).emit('roundEnd', { 
      winner: winner ? winner.username : null,
      revealedWord: round.word,
      scores 
    });
      
    if (updatedMatch.status === 'completed') {
      // Use the winner from the final match data
      const finalWinner = await this.playersService.findOneById(updatedMatch.winnerId!);
      server.to(matchId).emit('matchEnd', { winner: finalWinner!.username });
    } else {
      // Wait, then start the next round
      setTimeout(() => this.startNextRound(matchId, server), POST_ROUND_DELAY_MS);
    }
  }

  private async startNextRound(matchId: string, server: Server) {
    try {
      const newRound = await this.roundService.startNewRound(matchId);
      server.to(matchId).emit('nextRoundStarting', { wordLength: newRound.word.length });
      this.startLoop(matchId, server);
    } catch (error) {
      this.logger.error(`Failed to start next round for match ${matchId}:`, error);
      server.to(matchId).emit('error', 'Failed to start the next round.');
    }
  }

  isLoopActive(matchId: string): boolean {
    return this.activeLoops.has(matchId);
  }
}
