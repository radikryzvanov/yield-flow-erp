import { UserDto } from '../../users/dto/user.dto.js';

export class LoginResponseDto {
  /** JWT-токен. Отправляется в заголовке `Authorization: Bearer <токен>`. */
  accessToken: string;

  /** Через сколько секунд токен перестанет действовать. */
  expiresIn: number;

  user: UserDto;
}
