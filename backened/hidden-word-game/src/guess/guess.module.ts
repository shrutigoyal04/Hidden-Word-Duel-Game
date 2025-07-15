import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guess } from './entities/guess.entity';
import { GuessService } from './guess.service';
import { GuessController } from './guess.controller';
import { Round } from '../round/entities/round.entity';
import { Match } from '../match/entities/match.entity';
import { RoundModule } from 'src/round/round.module'; // <-- Add this import

@Module({
  imports: [
    TypeOrmModule.forFeature([Guess, Round, Match]),
    RoundModule, // <-- Add RoundModule here
  ],
  providers: [GuessService],
  // controllers: [GuessController],
  exports: [GuessService],
})
export class GuessModule {}
