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

// Create a selective logger that only filters database queries
class SelectiveLogger {
  // Filter out SQL queries
  logQuery() {}
  logQueryError() {}
  logQuerySlow() {}
  logSchemaBuild() {}
  logMigration() {}
  
  // Allow normal application logs
  log(level: string, message: any) {
    // Only pass through non-query logs
    if (!String(message).includes('query:') && !String(message).includes('PARAMETERS:')) {
      if (level === 'log') {
        console.log(message);
      } else if (level === 'info') {
        console.info(message);
      } else if (level === 'warn') {
        console.warn(message);
      } else if (level === 'error') {
        console.error(message);
      }
    }
  }
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
      database: process.env.DB_NAME,
      entities: [Players, Match, Round, Guess],
      synchronize: true,
      autoLoadEntities: true,
      logging: false,
      logger: new SelectiveLogger(), // Use selective logger instead of silent logger
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
