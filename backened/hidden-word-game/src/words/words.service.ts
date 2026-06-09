import { Injectable, Logger } from '@nestjs/common';

/**
 * Supplies words for each round. Uses a curated local dictionary of common
 * English words (4–7 letters) so that words are always guessable and the
 * service has no external/network dependency. Random length per round keeps
 * the game varied while staying fair.
 */
@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  // Curated list of common, guessable words. Kept lowercase and alphabetic.
  private readonly wordList: string[] = [
    'apple', 'beach', 'bread', 'chair', 'cloud', 'dance', 'dream', 'eagle',
    'earth', 'flame', 'fruit', 'ghost', 'grape', 'green', 'heart', 'house',
    'juice', 'knife', 'lemon', 'light', 'money', 'mouse', 'music', 'night',
    'ocean', 'paper', 'piano', 'plant', 'queen', 'river', 'robot', 'snake',
    'space', 'stone', 'storm', 'sugar', 'table', 'tiger', 'train', 'water',
    'apple', 'banana', 'castle', 'flower', 'forest', 'garden', 'island',
    'jungle', 'kitten', 'market', 'orange', 'pencil', 'planet', 'rabbit',
    'rocket', 'silver', 'spider', 'summer', 'window', 'winter', 'yellow',
    'galaxy', 'guitar', 'hammer', 'jacket', 'ladder', 'monkey', 'mirror',
    'lion', 'star', 'moon', 'wolf', 'fish', 'bird', 'tree', 'cake', 'gold',
  ];

  /**
   * Returns a random word for a new round. Kept async to preserve the existing
   * call sites that `await` it.
   */
  async getNewWord(): Promise<string> {
    const word =
      this.wordList[Math.floor(Math.random() * this.wordList.length)];
    // Log the chosen word so it can be observed during local development.
    this.logger.log(`Selected word for new round: "${word}"`);
    return Promise.resolve(word);
  }
}
