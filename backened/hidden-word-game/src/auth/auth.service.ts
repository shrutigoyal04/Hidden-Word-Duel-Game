import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PlayersService } from '../players/players.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private playersService: PlayersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    const existingUser = await this.playersService.findByUsernameOrEmail(username, email);

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const player = await this.playersService.create({
      username,
      email,
      password: hashedPassword,
    });

    // Omit password from the returned object
    const { password: _, ...result } = player;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    const player = await this.playersService.findOneByUsername(username);

    if (!player) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, player.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: player.id, username: player.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
