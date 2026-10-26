import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListBatchesQuery } from './dto/list-batches.query.js';
import { RegisterBatchDto } from './dto/register-batch.dto.js';
import { WarehouseSummaryDto } from './dto/warehouse-summary.dto.js';
import { EggBatch } from './egg-batch.entity.js';
import { EggStock } from './egg-stock.entity.js';
import { EggWarehouseService } from './egg-warehouse.service.js';

@ApiTags('Склад яйца')
@ApiBearerAuth()
@Controller('egg-warehouse')
export class EggWarehouseController {
  constructor(private readonly warehouse: EggWarehouseService) {}

  /** Партии валового яйца (новые сверху). Можно отфильтровать по статусу. */
  @Get('batches')
  listBatches(@Query() query: ListBatchesQuery): Promise<EggBatch[]> {
    return this.warehouse.listBatches(query.status);
  }

  /** Принять партию валового яйца из птичника. */
  @Post('batches')
  registerBatch(@Body() dto: RegisterBatchDto): Promise<EggBatch> {
    return this.warehouse.registerBatch(dto);
  }

  /** Рассортировать партию по категориям ГОСТ и добавить яйцо в остатки склада. */
  @Post('batches/:id/sort')
  @HttpCode(200)
  sortBatch(@Param('id', ParseUUIDPipe) id: string): Promise<EggBatch> {
    return this.warehouse.sortBatch(id);
  }

  /** Остатки готового яйца по категориям. */
  @Get('stocks')
  listStocks(): Promise<EggStock[]> {
    return this.warehouse.listStocks();
  }

  /** Итоги склада: сколько готового яйца и сколько ждёт сортировки. */
  @Get('summary')
  summary(): Promise<WarehouseSummaryDto> {
    return this.warehouse.summary();
  }
}
