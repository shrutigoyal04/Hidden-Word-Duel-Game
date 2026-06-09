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

// Create a silent logger that does nothing
class SilentLogger {
  logQuery() {}
  logQueryError() {}
  logQuerySlow() {}
  logSchemaBuild() {}
  logMigration() {}
  log() {}
}

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
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      // .env defines DB_DATABASE; fall back to DB_NAME for compatibility.
      database: process.env.DB_DATABASE || process.env.DB_NAME,
      entities: [Players, Match, Round, Guess],
      synchronize: true,
      autoLoadEntities: true,
      logging: false,
      logger: new SilentLogger(), // Add this custom logger
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
