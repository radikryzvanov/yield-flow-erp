import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseDailyReport } from './house-daily-report.entity.js';
import { House } from './house.entity.js';
import { HousesController } from './houses.controller.js';
import { HousesService } from './houses.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([House, HouseDailyReport])],
  controllers: [HousesController],
  providers: [HousesService],
})
export class HousesModule {}
