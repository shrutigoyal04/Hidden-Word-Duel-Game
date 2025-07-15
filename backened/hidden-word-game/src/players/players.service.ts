import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Players } from './entities/players.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Players)
    private playersRepository: Repository<Players>,
  ) {}

  // ADDED: This method was missing, causing errors in the gateway and loop service.
  async findOneById(id: string): Promise<Players | null> {
    return this.playersRepository.findOneBy({ id });
  }

  async findOneByUsername(username: string): Promise<Players | null> {
    return this.playersRepository.findOne({ where: { username } });
  }
  
  async findByUsernameOrEmail(username: string, email: string): Promise<Players | null> {
    return this.playersRepository.findOne({ where: [{ username }, { email }] });
  }

  async create(playerData: Partial<Players>): Promise<Players> {
    const player = this.playersRepository.create(playerData);
    return this.playersRepository.save(player);
  }
}