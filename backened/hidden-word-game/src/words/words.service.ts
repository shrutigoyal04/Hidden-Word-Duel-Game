import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs'; //RxJS method converts an Observable to a Promise.

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
      // We will try to fetch a random word from the API.
      const response = await firstValueFrom(
        this.httpService.get<string[]>('https://random-word-api.herokuapp.com/word?number=1')
      );
      const word = response.data[0];
      this.logger.log(`Fetched new word from API: ${word}`);
      return word;
    } catch (error) {
      // If the API fails for any reason, we log the error and use our fallback list.
      this.logger.error('Failed to fetch word from API, using fallback list.', error.stack);
      return this.getFallbackWord();
    }
  }

  private getFallbackWord(): string {
    const randomIndex = Math.floor(Math.random() * this.fallbackWordList.length);
    const fallbackWord = this.fallbackWordList[randomIndex];
    this.logger.log(`Using fallback word: ${fallbackWord}`);
    return fallbackWord;
  }
} 