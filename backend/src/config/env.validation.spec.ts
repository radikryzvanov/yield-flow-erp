import { validateEnv } from './env.validation.js';

const validEnv = {
  DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
  JWT_SECRET: 'a'.repeat(32),
  ADMIN_LOGIN: 'admin',
  ADMIN_PASSWORD: 'long-enough-password',
};

describe('validateEnv (проверка настроек при запуске)', () => {
  it('принимает корректные настройки и подставляет значения по умолчанию', () => {
    const env = validateEnv(validEnv);
    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN_SECONDS).toBe(28800);
    expect(env.SEED_DEMO_DATA).toBe('true');
  });

  it('отклоняет слишком короткий секрет для токенов', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('отклоняет слабый пароль администратора', () => {
    expect(() => validateEnv({ ...validEnv, ADMIN_PASSWORD: '123' })).toThrow(
      /ADMIN_PASSWORD/,
    );
  });

  it('сообщает, какой настройки не хватает', () => {
    const { DATABASE_URL: _omitted, ...withoutDb } = validEnv;
    expect(() => validateEnv(withoutDb)).toThrow(/DATABASE_URL/);
  });
});
