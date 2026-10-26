import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

/**
 * Общая настройка приложения. Её используют и настоящий сервер (main.ts),
 * и автотесты — чтобы тесты проверяли ровно то, что работает в бою.
 */
export function setupApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);

  // Сервер стоит за прокси хостинга: берём настоящий адрес клиента (нужно для лимита попыток входа).
  app.set('trust proxy', 1);

  // Защитные HTTP-заголовки. CSP отключён: API отдаёт только JSON, а Swagger UI использует встроенные скрипты.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Разрешаем обращаться к API только с наших сайтов.
  app.enableCors({
    origin: config
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim()),
  });

  // Все адреса начинаются с /api.
  app.setGlobalPrefix('api');

  // Проверка входных данных: лишние поля запрещены (ответ 400), типы приводятся.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Документация API: http://localhost:3000/api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('YieldFlow ERP API')
    .setDescription('Серверная часть демо-системы учёта птицефабрики')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
}
