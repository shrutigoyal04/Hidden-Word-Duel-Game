import { Module } from '@nestjs/common'; // No longer importing forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { MatchService } from './match.service';
import { GameLoopService } from './game-loop.service';
import { PlayersModule } from '../players/players.module';
import { RoundModule } from '../round/round.module';
import { GuessModule } from '../guess/guess.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match]),
    PlayersModule,
    RoundModule, 
    GuessModule,
  ],
  providers: [MatchService, GameLoopService],
  exports: [MatchService, GameLoopService],
})
export class MatchModule {}
