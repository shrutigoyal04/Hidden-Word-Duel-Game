import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PlayersModule } from '../players/players.module'; 
import { WsJwtGuard } from './ws-jwt.guard';

@Module({
  imports: [
    PlayersModule,
    ConfigModule,   // For reading env variables like JWT_SECRET
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, WsJwtGuard],
  controllers: [AuthController],
  exports: [AuthService, WsJwtGuard, JwtModule],
})
export class AuthModule {}
