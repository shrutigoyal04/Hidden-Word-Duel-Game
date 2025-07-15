import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from './entities/round.entity';
import { WordsService } from '../words/words.service';

@Injectable()
export class RoundService {
  constructor(
    @InjectRepository(Round)
    private roundRepository: Repository<Round>,
    private readonly wordsService: WordsService,
  ) {}

  async startNewRound(matchId: string): Promise<Round> {
    // CORRECTED: Using your 'getNewWord' function and adding 'await'
    // because it's an async operation (fetches from an API).
    const word = await this.wordsService.getNewWord();
    const roundCount = await this.roundRepository.count({ where: { matchId } });
    
    const newRound = this.roundRepository.create({
      matchId,
      word,
      revealedTiles: Array(word.length).fill(false),
      roundNumber: roundCount + 1,
    });

    return this.roundRepository.save(newRound);
  }

  async getLatestRoundForMatch(matchId: string): Promise<Round | null> {
    return this.roundRepository.findOne({
      where: { matchId },
      order: { roundNumber: 'DESC' },
    });
  }

  async revealRandomTile(roundId: string) {
    const round = await this.roundRepository.findOneBy({ id: roundId });
    if (!round) throw new NotFoundException('Round not found');

    const unrevealedIndexes = round.revealedTiles
      .map((revealed, index) => (revealed ? null : index))
      .filter((index) => index !== null);

    if (unrevealedIndexes.length === 0) {
      return { round, index: null, letter: null, isFullyRevealed: true };
    }

    const randomIndex = unrevealedIndexes[Math.floor(Math.random() * unrevealedIndexes.length)]!;
    round.revealedTiles[randomIndex] = true;
    
    const updatedRound = await this.roundRepository.save(round);
    const isFullyRevealed = updatedRound.revealedTiles.every(r => r);

    return {
      round: updatedRound,
      index: randomIndex,
      letter: round.word[randomIndex],
      isFullyRevealed,
    };
  }

  // This method is required by GameLoopService to end a round.
  async endRound(matchId: string, winnerId: string | null): Promise<Round> {
    const round = await this.getLatestRoundForMatch(matchId);
    if (!round) throw new NotFoundException('Could not find round to end');

    round.winnerId = winnerId;
    round.endedAt = new Date();
    
    return this.roundRepository.save(round);
  }
}

