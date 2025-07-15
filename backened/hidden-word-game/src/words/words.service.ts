import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);
  private readonly fallbackWordList: string[] = [
    'apple', 'banana', 'cherry', 'rocket', 'planet', 'galaxy', 'comet',
    'orbit', 'lunar', 'solar', 'nebula', 'star', 'earth', 'mars', 'jupiter',
  ];

  constructor(private readonly httpService: HttpService) {}

  async getNewWord(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<string[]>('https://random-word-api.herokuapp.com/word?number=1')
      );
      const word = response.data[0];
      // Make the word log stand out
      console.log('\n==============================');
      console.log(`🎮 GAME WORD: "${word}" 🎮`);
      console.log('==============================\n');
      return word;
    } catch (error) {
      const fallbackWord = this.getFallbackWord();
      // Make the fallback word log stand out
      console.log('\n==============================');
      console.log(`🎮 FALLBACK WORD: "${fallbackWord}" 🎮`);
      console.log('==============================\n');
      return fallbackWord;
    }
  }

  private getFallbackWord(): string {
    const randomIndex = Math.floor(Math.random() * this.fallbackWordList.length);
    return this.fallbackWordList[randomIndex];
  }
} 