import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BirdsCountDto } from './dto/birds-count.dto.js';
import { CreateHouseDto } from './dto/create-house.dto.js';
import { DailyReportDto } from './dto/daily-report.dto.js';
import { UpdateHouseDto } from './dto/update-house.dto.js';
import { HouseDailyReport } from './house-daily-report.entity.js';
import { House } from './house.entity.js';
import { HousesService } from './houses.service.js';

@ApiTags('Птичники')
@ApiBearerAuth()
@Controller('houses')
export class HousesController {
  constructor(private readonly houses: HousesService) {}

  /** Список всех птичников. */
  @Get()
  findAll(): Promise<House[]> {
    return this.houses.findAll();
  }

  /** Один птичник по id. */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<House> {
    return this.houses.findOne(id);
  }

  /** Добавить птичник. */
  @Post()
  create(@Body() dto: CreateHouseDto): Promise<House> {
    return this.houses.create(dto);
  }

  /** Изменить данные птичника (достаточно прислать изменяемые поля). */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHouseDto,
  ): Promise<House> {
    return this.houses.update(id, dto);
  }

  /** Удалить птичник вместе с историей его суточных отчётов. */
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.houses.remove(id);
  }

  /** Внести суточный отчёт: сбор яиц, падёж, корм, микроклимат. Возвращает обновлённый птичник. */
  @Post(':id/daily-reports')
  addDailyReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DailyReportDto,
  ): Promise<House> {
    return this.houses.addDailyReport(id, dto);
  }

  /** История суточных отчётов птичника (последние 30). */
  @Get(':id/daily-reports')
  listReports(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<HouseDailyReport[]> {
    return this.houses.listReports(id);
  }

  /** Принять выведенный молодняк из инкубатория. */
  @Post(':id/receive-flock')
  @HttpCode(200)
  receiveFlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BirdsCountDto,
  ): Promise<House> {
    return this.houses.receiveFlock(id, dto);
  }

  /** Убрать птицу из птичника (например, отправка на убой). */
  @Post(':id/remove-birds')
  @HttpCode(200)
  removeBirds(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BirdsCountDto,
  ): Promise<House> {
    return this.houses.removeBirds(id, dto);
  }
}
