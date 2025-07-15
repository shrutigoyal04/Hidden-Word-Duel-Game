import { Module } from '@nestjs/common'; // No longer importing forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './entities/round.entity';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';
import { WordsModule } from '../words/words.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Round]),
    WordsModule,
    // REMOVED: forwardRef(() => MatchModule) is no longer needed
  ],
  providers: [RoundService],
  controllers: [RoundController],
  exports: [RoundService],
})
export class RoundModule {}
