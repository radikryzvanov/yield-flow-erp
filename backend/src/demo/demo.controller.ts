import { Controller, ForbiddenException, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator.js';
import type { AuthUser } from '../common/current-user.decorator.js';
import { UserRole } from '../users/user.entity.js';
import { SeedService } from './seed.service.js';

@ApiTags('Демо')
@ApiBearerAuth()
@Controller('demo')
export class DemoController {
  constructor(private readonly seed: SeedService) {}

  /** Вернуть птичники и склад яйца к исходным демо-данным. Только для администратора. */
  @Post('reset')
  @HttpCode(200)
  async reset(@CurrentUser() user: AuthUser): Promise<{ message: string }> {
    if (user.role !== UserRole.Admin) {
      throw new ForbiddenException('Сброс данных доступен только администратору');
    }
    await this.seed.resetDemoData();
    return { message: 'Демо-данные восстановлены' };
  }
}
