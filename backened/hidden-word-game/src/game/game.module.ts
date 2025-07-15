import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { MatchModule } from '../match/match.module';
import { RoundModule } from '../round/round.module';
import { PlayersModule } from '../players/players.module';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    MatchModule,
    RoundModule,
    PlayersModule,
    AuthModule, // Add AuthModule to imports
  ],
  providers: [GameGateway],
})
export class GameModule {}