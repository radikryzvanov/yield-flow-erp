import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EggBatch } from '../egg-warehouse/egg-batch.entity.js';
import { EggStock } from '../egg-warehouse/egg-stock.entity.js';
import { HouseDailyReport } from '../houses/house-daily-report.entity.js';
import { House } from '../houses/house.entity.js';
import { UsersModule } from '../users/users.module.js';
import { DemoController } from './demo.controller.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([House, HouseDailyReport, EggBatch, EggStock]),
  ],
  controllers: [DemoController],
  providers: [SeedService],
})
export class DemoModule {}
