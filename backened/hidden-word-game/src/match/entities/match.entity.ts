import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { Round } from '../../round/entities/round.entity';
import { Players } from '../../players/entities/players.entity';

export type MatchStatus = 'ongoing' | 'completed';

@Entity()
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  player1Id: string;

  @Column()
  player2Id: string;

  @Column({ default: 0 })
  score1: number;

  @Column({ default: 0 })
  score2: number;

  @Column({ type: 'varchar', nullable: true })
  winnerId: string | null;

  @Column({ type: 'enum', enum: ['ongoing', 'completed'], default: 'ongoing' })
  status: MatchStatus;

  @OneToMany(() => Round, (round) => round.match)
  rounds: Round[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}