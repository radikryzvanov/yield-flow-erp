import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser } from '../common/current-user.decorator.js';
import type { UserRole } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';

interface JwtPayload {
  sub: string;
  login: string;
  role: UserRole;
}

/**
 * Проверка токена на каждом запросе: подпись и срок действия проверяет passport-jwt,
 * а здесь мы дополнительно убеждаемся, что пользователь всё ещё существует и активен.
 * Так отключённый сотрудник теряет доступ сразу, а не когда истечёт его токен.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return { id: user.id, login: user.login, role: user.role };
  }
}
