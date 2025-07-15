import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { LobbyService } from './lobby.service';
import { MatchService } from '../match/match.service';
import { WsJwtGuard } from '../auth/ws-jwt.guard';

@WebSocketGateway({ cors: { origin: '*' } })
export class LobbyGateway {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(LobbyGateway.name);

  constructor(
    private readonly lobbyService: LobbyService,
    private readonly matchService: MatchService,
  ) {}

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinLobby')
  async handleJoinLobby(@ConnectedSocket() client: Socket) {
    const userPayload = client.data.user;
    const playerId = userPayload.sub;

    client.data.playerId = playerId;
    await this.lobbyService.addPlayerToLobby(playerId, client.id);

    const waitingPlayers = await this.lobbyService.getWaitingPlayersWithSockets();

    if (waitingPlayers.length >= 2) {
      const [player1, player2] = waitingPlayers;
      await this.lobbyService.clearLobby();
      this.logger.log(`Match found: ${player1.playerId} vs ${player2.playerId}`);

      const { match } = await this.matchService.createMatch(player1.playerId, player2.playerId);
      
      // Tell both clients the match is ready and which URL to go to.
      this.server.to(player1.socketId).to(player2.socketId).emit('matchReady', { matchId: match.id });
    }
  }
} 