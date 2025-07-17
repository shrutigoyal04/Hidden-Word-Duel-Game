import { Module } from '@nestjs/common'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './entities/round.entity';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';
import { WordsModule } from '../words/words.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Round]),
    WordsModule,
  ],
  providers: [RoundService],
  controllers: [RoundController],
  exports: [RoundService],
})
export class RoundModule {}
