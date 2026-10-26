import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UserRole } from '../users/user.entity.js';

/** Что известно о вошедшем пользователе внутри обработчика запроса. */
export interface AuthUser {
  id: string;
  login: string;
  role: UserRole;
}

/** Достаёт текущего пользователя из запроса: `@CurrentUser() user: AuthUser`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<Request & { user: AuthUser }>().user,
);
