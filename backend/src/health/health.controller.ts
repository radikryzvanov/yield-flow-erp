import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../common/public.decorator.js';

@ApiTags('Состояние сервера')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * «Сервер жив?» — база НЕ трогается. Именно по этому адресу сайт «будит» сервер
   * и проверяет его, не расходуя часы бесплатной базы.
   */
  @Get()
  live() {
    return { status: 'ok' };
  }

  /** «База отвечает?» — делает простой запрос SELECT 1. Для ручной проверки. */
  @Get('db')
  async database() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', database: 'up' };
  }
}
