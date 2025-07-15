import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PlayersModule } from './players/players.module';
import { AuthModule } from './auth/auth.module';
import { GuessModule } from './guess/guess.module';
import { RoundModule } from './round/round.module';
import { LobbyModule } from './lobby/lobby.module';
import { MatchModule } from './match/match.module';
import { WordsModule } from './words/words.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { Players } from './players/entities/players.entity';
import { Match } from './match/entities/match.entity';
import { Round } from './round/entities/round.entity';
import { Guess } from './guess/entities/guess.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME, // Use environment variables
      password: process.env.DB_PASSWORD, // Use environment variables
      database: process.env.DB_NAME,     // Use environment variables
      entities: [Players, Match, Round, Guess],
      synchronize: true, // `true` for development to auto-create schema. Set to `false` in production.
      autoLoadEntities: true,
      // dropSchema: true,
      logging: true,
    }),
    PlayersModule,
    AuthModule,
    GuessModule,
    RoundModule,
    LobbyModule,
    WordsModule,
    MatchModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
