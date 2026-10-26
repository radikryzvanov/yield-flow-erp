/**
 * Запускается ДО подключения тестов (настройки приложения проверяются при импорте).
 * Нужна переменная TEST_DATABASE_URL с отдельной тестовой базой — перед тестами
 * её содержимое ПОЛНОСТЬЮ удаляется, поэтому в имени базы обязательно слово "test".
 */
const testDbUrl = process.env.TEST_DATABASE_URL;
if (!testDbUrl || !/test/i.test(testDbUrl)) {
  throw new Error(
    'Задайте TEST_DATABASE_URL (имя базы должно содержать "test"), ' +
      'например: postgres://postgres:postgres@localhost:5432/yieldflow_test',
  );
}

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: testDbUrl,
  JWT_SECRET: 'test-secret-'.repeat(4),
  ADMIN_LOGIN: 'admin',
  ADMIN_PASSWORD: 'TestPassword-123',
  CORS_ORIGINS: 'http://localhost:4200',
  SEED_DEMO_DATA: 'true',
});
