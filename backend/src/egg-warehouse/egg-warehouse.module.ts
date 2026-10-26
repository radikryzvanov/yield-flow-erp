import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { House } from '../houses/house.entity.js';
import { EggBatch } from './egg-batch.entity.js';
import { EggStock } from './egg-stock.entity.js';
import { EggWarehouseController } from './egg-warehouse.controller.js';
import { EggWarehouseService } from './egg-warehouse.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EggBatch, EggStock, House])],
  controllers: [EggWarehouseController],
  providers: [EggWarehouseService],
})
export class EggWarehouseModule {}
