import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Guess } from '../../guess/entities/guess.entity';
import { Match } from '../../match/entities/match.entity';

@Entity()
export class Players {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 0 })
  totalWins: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Guess, (guess) => guess.player)
  guesses: Guess[];
}