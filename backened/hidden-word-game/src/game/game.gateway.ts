import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard';
import { GameLoopService } from '../match/game-loop.service';
import { MatchService } from '../match/match.service';
import { RoundService } from '../round/round.service';
import { PlayersService } from '../players/players.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(GameGateway.name);

  constructor(
    private readonly gameLoopService: GameLoopService,
    private readonly matchService: MatchService,
    private readonly roundService: RoundService,
    private readonly playersService: PlayersService,
  ) {}

  handleDisconnect(client: Socket) {
    const matchId = Array.from(client.rooms).find(room => room !== client.id);
    if (matchId) {
      this.gameLoopService.stopLoop(matchId);
      this.logger.log(`Player disconnected, stopping loop for match ${matchId}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,    //actual player
  ) {
    const user = client.data.user; // Get user payload from the guard
    client.join(data.matchId);
    this.logger.log(`Player ${user.username} joined game room ${data.matchId}`);

    const match = await this.matchService.findOne(data.matchId);
    const round = await this.roundService.getLatestRoundForMatch(data.matchId);

    if (match && round) {
      const player1 = await this.playersService.findOneById(match.player1Id);
      const player2 = await this.playersService.findOneById(match.player2Id);
      if (!player1 || !player2) {
        this.logger.error(`Could not find one or both players for match ${data.matchId}`);
        return;
      }

      const opponent = player1.id === user.sub ? player2 : player1;
      const scores = { [player1.username]: match.score1, [player2.username]: match.score2 };
      const revealedWord = round.word.split('').map((char, i) => round.revealedTiles[i] ? char : '_');

      client.emit('gameSync', {
        opponentName: opponent.username,
        word: revealedWord,
        scores,
      });

      const room = this.server.sockets.adapter.rooms.get(data.matchId);
      if (room && room.size === 2 && !this.gameLoopService.isLoopActive(match.id)) {
        this.logger.log(`Both players present. Starting loop for match ${match.id}`);
        this.gameLoopService.startLoop(match.id, this.server);
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('guess')
  handleGuess(
    @MessageBody() data: { guess: string },
    @ConnectedSocket() client: Socket,
  ) {
    // CORRECT: Get player ID directly from the validated token payload
    const playerId = client.data.user.sub;
    const matchId = Array.from(client.rooms).find(room => room !== client.id);

    if (matchId && playerId && data.guess) {
      // Delegate the guess processing to the single source of truth: GameLoopService
      this.gameLoopService.processGuess(matchId, playerId, data.guess, this.server);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('restartMatch')
  async handleRestartMatch(
    @MessageBody() data: { matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user = client.data.user;
    const oldMatchId = data.matchId;
    
    const oldMatch = await this.matchService.findOne(oldMatchId);
    if (!oldMatch) {
      client.emit('error', 'Match not found');
      return;
    }
    
    // Check if the user is part of this match
    if (oldMatch.player1Id !== user.sub && oldMatch.player2Id !== user.sub) {
      client.emit('error', 'You are not part of this match');
      return;
    }
    
    // Create a new match with the same players
    const { match: newMatch } = await this.matchService.restartMatch(oldMatchId);
    
    // Notify both players about the new match
    this.server.to(oldMatchId).emit('matchRestarted', { matchId: newMatch.id });
  }
}