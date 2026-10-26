import { User, UserRole } from '../user.entity.js';

/** Публичные данные пользователя (без пароля и служебных полей). */
export class UserDto {
  id: string;
  login: string;
  fullName: string;
  role: UserRole;

  static fromEntity(user: User): UserDto {
    const dto = new UserDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.fullName = user.fullName;
    dto.role = user.role;
    return dto;
  }
}
