import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Все настройки сервера приходят из переменных окружения.
 * Если чего-то не хватает или значение слабое (короткий секрет) —
 * сервер не запустится и сразу скажет, чего именно не хватает.
 */
class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  /** Строка подключения к PostgreSQL (у Neon она уже содержит sslmode=require). */
  @IsString()
  @MinLength(10)
  DATABASE_URL: string;

  /** Секрет для подписи JWT-токенов. Минимум 32 символа. */
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  /** Сколько секунд живёт токен входа (по умолчанию 8 часов). */
  @IsInt()
  @Min(60)
  JWT_EXPIRES_IN_SECONDS: number = 28800;

  /** Логин и пароль первого администратора (создаётся при первом запуске). */
  @IsString()
  @MinLength(3)
  ADMIN_LOGIN: string;

  @IsString()
  @MinLength(8)
  ADMIN_PASSWORD: string;

  /** Адреса сайтов, которым разрешено обращаться к API (через запятую). */
  @IsString()
  @MinLength(1)
  CORS_ORIGINS: string = 'http://localhost:4200';

  /** Заполнять ли пустую базу демо-данными птицефабрики. */
  @IsIn(['true', 'false'])
  SEED_DEMO_DATA: string = 'true';
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated);

  if (errors.length > 0) {
    const details = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join('; ')}`)
      .join('\n');
    throw new Error(`Неверные переменные окружения:\n${details}`);
  }
  return validated;
}
