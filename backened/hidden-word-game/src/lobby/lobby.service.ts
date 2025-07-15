import { Injectable } from '@nestjs/common';

@Injectable()
export class LobbyService {
  private waitingPlayers: { playerId: string; socketId: string }[] = [];

  async addPlayerToLobby(
    playerId: string,
    socketId: string,
  ): Promise<void> {
    // Prevent adding the same player/socket multiple times
    if (
      !this.waitingPlayers.some(
        (p) => p.playerId === playerId || p.socketId === socketId,
      )
    ) {
      this.waitingPlayers.push({ playerId, socketId });
    }
  }

  async removePlayerFromLobby(playerId: string): Promise<void> {
    this.waitingPlayers = this.waitingPlayers.filter(
      (p) => p.playerId !== playerId,
    );
  }

  async getWaitingPlayersWithSockets(): Promise<
    { playerId: string; socketId: string }[]
  > {
    return [...this.waitingPlayers];
  }

  async clearLobby(): Promise<void> {
    this.waitingPlayers = [];
  }
} 