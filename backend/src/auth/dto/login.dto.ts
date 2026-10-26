import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  /** Логин пользователя (регистр не важен). */
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  login: string;

  /** Пароль. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
