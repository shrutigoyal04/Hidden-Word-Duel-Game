import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WordsService } from './words.service';

@Module({
  imports: [HttpModule],
  providers: [WordsService],
  exports: [WordsService],
})
export class WordsModule {}
