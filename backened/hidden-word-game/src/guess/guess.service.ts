import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guess } from './entities/guess.entity';

@Injectable()
export class GuessService {
  constructor(
    @InjectRepository(Guess)
    private readonly guessRepository: Repository<Guess>,
  ) {}

  /**
   * Creates and saves a record of a player's guess.
   */
  async createGuess(
    playerId: string,
    roundId: string,
    guess: string,
    isCorrect: boolean,
  ): Promise<Guess> {
    const newGuess = this.guessRepository.create({
      playerId,
      roundId,
      guess: guess.trim(),
      isCorrect,
    });
    return this.guessRepository.save(newGuess);
  }
}
