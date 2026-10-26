import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.validation.js';
import { InitSchema1761480000000 } from './database/migrations/1761480000000-init-schema.js';
import { DemoModule } from './demo/demo.module.js';
import { EggBatch } from './egg-warehouse/egg-batch.entity.js';
import { EggStock } from './egg-warehouse/egg-stock.entity.js';
import { EggWarehouseModule } from './egg-warehouse/egg-warehouse.module.js';
import { HealthController } from './health/health.controller.js';
import { HouseDailyReport } from './houses/house-daily-report.entity.js';
import { House } from './houses/house.entity.js';
import { HousesModule } from './houses/houses.module.js';
import { User } from './users/user.entity.js';

@Module({
  imports: [
    // Читает переменные окружения (и файл .env при локальной разработке) и проверяет их.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),

    // Общий лимит запросов: не более 120 в минуту с одного адреса.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.getOrThrow<string>('DATABASE_URL'),
        entities: [User, House, HouseDailyReport, EggBatch, EggStock],
        // Схему базы меняют только миграции — никакой автоматической синхронизации.
        migrations: [InitSchema1761480000000],
        migrationsRun: true,
        synchronize: false,
        // Расширения базы не устанавливаем (id генерирует встроенная gen_random_uuid).
        installExtensions: false,
        logging:
          config.get('NODE_ENV') === 'development'
            ? ['error', 'warn', 'migration']
            : ['error', 'warn'],
        // Бесплатная база засыпает: не держим лишние соединения и ждём первое подольше.
        extra: {
          max: 5,
          idleTimeoutMillis: 10_000,
          connectionTimeoutMillis: 20_000,
        },
      }),
    }),

    AuthModule,
    HousesModule,
    EggWarehouseModule,
    DemoModule,
  ],
  controllers: [HealthController],
  providers: [
    // Ограничитель частоты запросов включён для всего приложения.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
