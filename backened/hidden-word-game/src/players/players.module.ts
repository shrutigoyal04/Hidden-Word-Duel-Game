import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Players } from './entities/players.entity';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Players])],
  providers: [PlayersService],
  controllers: [PlayersController],
  exports: [PlayersService], // We export this to use in other modules
})
export class PlayersModule {}
