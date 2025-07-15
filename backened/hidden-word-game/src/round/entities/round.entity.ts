import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Guess } from '../../guess/entities/guess.entity';
import { Match } from '../../match/entities/match.entity';

@Entity()
export class Round {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  word: string;

  @Column('boolean', { array: true, default: [] })
  revealedTiles: boolean[];

  @Column({ type: 'varchar', nullable: true })
  winnerId: string | null;

  @Column()
  roundNumber: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @ManyToOne(() => Match, (match) => match.rounds)
  match: Match;

  @Column()
  matchId: string;

  @OneToMany(() => Guess, (guess) => guess.round)
  guesses: Guess[];
}