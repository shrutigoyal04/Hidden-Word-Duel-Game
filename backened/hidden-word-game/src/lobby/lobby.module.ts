import { Module } from '@nestjs/common';
import { LobbyService } from './lobby.service';
import { LobbyGateway } from './lobby.gateway';
import { MatchModule } from '../match/match.module';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    MatchModule,
    AuthModule, // Add AuthModule to imports
  ],
  providers: [LobbyGateway, LobbyService],
})
export class LobbyModule {} 