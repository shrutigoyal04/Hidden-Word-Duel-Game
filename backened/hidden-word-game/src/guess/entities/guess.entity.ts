import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Round } from '../../round/entities/round.entity';
import { Players } from '../../players/entities/players.entity';

@Entity()
export class Guess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  guess: string;

  @Column()
  isCorrect: boolean;

  @ManyToOne(() => Round, (round) => round.guesses)
  round: Round;

  @Column()
  roundId: string;

  @ManyToOne(() => Players, (player) => player.guesses)
  player: Players;

  @Column()
  playerId: string;

  @CreateDateColumn()
  timestamp: Date;
}