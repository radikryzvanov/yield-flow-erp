import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UserDto } from '../users/dto/user.dto.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';

/** Стоимость хеширования: чем выше, тем дороже подбор пароля. 10 — разумный минимум. */
export const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  /**
   * Заранее посчитанный хеш «пустышки». Если логина нет в базе, мы всё равно
   * делаем сравнение, чтобы время ответа не выдавало, существует ли такой логин.
   */
  private readonly dummyHash = hash('dummy-password', BCRYPT_ROUNDS);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users.findByLoginWithPassword(dto.login);

    const passwordHash = user?.passwordHash ?? (await this.dummyHash);
    const passwordOk = await compare(dto.password, passwordHash);

    // Одно и то же сообщение для всех причин отказа — не подсказываем злоумышленнику.
    if (!user || !user.isActive || !passwordOk) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      login: user.login,
      role: user.role,
    });

    return {
      accessToken,
      expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS'),
      user: UserDto.fromEntity(user),
    };
  }
}
