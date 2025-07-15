import { Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './entities/match.entity';
import { PlayersService } from '../players/players.service';
import { RoundService } from '../round/round.service';

const MAX_SCORE = 3; // Match ends when a player reaches this score

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private readonly playersService: PlayersService,
    // Use forwardRef for circular dependency between Match and Round services
    @Inject(forwardRef(() => RoundService))
    private readonly roundService: RoundService,
  ) {}

  async findOne(id: string): Promise<Match | null> {
    return this.matchRepository.findOneBy({ id });
  }

  async createMatch(player1Id: string, player2Id: string) {
    const match = this.matchRepository.create({ player1Id, player2Id });
    await this.matchRepository.save(match);
    const round = await this.roundService.startNewRound(match.id);
    return { match, round };
  }

  // ADDED: This method was missing, causing an error in the game loop.
  async updateScores(matchId: string, winnerId: string | null) {
    const match = await this.findOne(matchId);
    if (!match) throw new NotFoundException('Match not found');

    if (winnerId) {
      if (winnerId === match.player1Id) {
        match.score1++;
      } else if (winnerId === match.player2Id) {
        match.score2++;
      }
    }
    
    if (match.score1 >= MAX_SCORE || match.score2 >= MAX_SCORE) {
      match.status = 'completed';
      match.winnerId = match.score1 > match.score2 ? match.player1Id : match.player2Id;
    }

    const updatedMatch = await this.matchRepository.save(match);
    const player1 = await this.playersService.findOneById(match.player1Id);
    const player2 = await this.playersService.findOneById(match.player2Id);

    if (!player1 || !player2) throw new NotFoundException('Could not find one or both players');

    return { updatedMatch, player1, player2 };
  }

  async restartMatch(matchId: string) {
    const match = await this.findOne(matchId);
    if (!match) throw new NotFoundException('Match not found');
    
    // Create a new match with the same players
    const newMatch = await this.createMatch(match.player1Id, match.player2Id);
    
    return newMatch;
  }
}
