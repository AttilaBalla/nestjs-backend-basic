import { ForbiddenException, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { ExceptionService } from '../exception/exception.service';
import { LoginDto, SignUpDto } from './auth.dto';
import * as argon from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private db: DbService,
    private exceptionHandler: ExceptionService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signUp(dto: SignUpDto) {
    const hash = await argon.hash(dto.password);
    try {
      const user = await this.db.user.create({
        data: {
          email: dto.email,
          passwordHash: hash,
        },
      });

      return this.signToken(user.id, user.email);
    } catch (error) {
      console.log(error);
      return this.exceptionHandler.handle(error);
    }
  }

  async login(dto: LoginDto) {
    const user = await this.db.user.findUnique({
      where: {
        email: dto.username,
      },
    });

    if (!user) throw new ForbiddenException('Credentials are incorrect');

    const pwMatches = await argon.verify(user.passwordHash, dto.password);

    if (!pwMatches) throw new ForbiddenException('Credentials are incorrect');

    return this.signToken(user.id, user.email);
  }

  async signToken(userId: number, email: string): Promise<{ token: string }> {
    const payload = {
      sub: userId,
      email: email,
    };

    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '1d',
      secret: secret,
    });

    return {
      token,
    };
  }
}
