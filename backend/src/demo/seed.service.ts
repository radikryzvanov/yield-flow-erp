import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BCRYPT_ROUNDS } from '../auth/auth.service.js';
import { EggBatch } from '../egg-warehouse/egg-batch.entity.js';
import { EggStock } from '../egg-warehouse/egg-stock.entity.js';
import { HouseDailyReport } from '../houses/house-daily-report.entity.js';
import { House } from '../houses/house.entity.js';
import { UserRole } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { DEMO_HOUSES, DEMO_PENDING_BATCHES, DEMO_STOCKS } from './demo-data.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly dataSource: DataSource,
    @InjectRepository(House) private readonly houses: Repository<House>,
    @InjectRepository(EggStock) private readonly stocks: Repository<EggStock>,
  ) {}

  /** Выполняется один раз при каждом запуске сервера, после подключения к базе. */
  async onApplicationBootstrap(): Promise<void> {
    await this.ensureAdmin();
    if (this.config.get('SEED_DEMO_DATA') === 'true') {
      await this.seedDemoDataIfEmpty();
    }
  }

  /** Создаёт первого администратора из настроек, только если пользователей ещё нет. */
  private async ensureAdmin(): Promise<void> {
    if ((await this.users.count()) > 0) return;

    await this.users.create({
      login: this.config.getOrThrow<string>('ADMIN_LOGIN'),
      passwordHash: await hash(
        this.config.getOrThrow<string>('ADMIN_PASSWORD'),
        BCRYPT_ROUNDS,
      ),
      fullName: 'Администратор',
      role: UserRole.Admin,
    });
    this.logger.log('Создан первый администратор');
  }

  private async seedDemoDataIfEmpty(): Promise<void> {
    const empty =
      (await this.houses.count()) === 0 && (await this.stocks.count()) === 0;
    if (!empty) return;

    await this.dataSource.transaction((em) => this.insertDemoData(em));
    this.logger.log('База была пуста — добавлены демо-данные');
  }

  /** Возвращает птицефабрику к исходным демо-цифрам (удаляет текущие данные). */
  resetDemoData(): Promise<void> {
    return this.dataSource.transaction(async (em) => {
      // Порядок важен: сначала таблицы, которые ссылаются на птичники.
      await em.createQueryBuilder().delete().from(HouseDailyReport).execute();
      await em.createQueryBuilder().delete().from(EggBatch).execute();
      await em.createQueryBuilder().delete().from(House).execute();
      await em.createQueryBuilder().delete().from(EggStock).execute();
      await this.insertDemoData(em);
    });
  }

  private async insertDemoData(em: EntityManager): Promise<void> {
    const houses = await em.save(
      DEMO_HOUSES.map((data) => em.create(House, data)),
    );
    await em.save(DEMO_STOCKS.map((data) => em.create(EggStock, data)));
    await em.save(
      DEMO_PENDING_BATCHES.map(({ houseIndex, rawEggCount }) =>
        em.create(EggBatch, {
          houseId: houses[houseIndex].id,
          houseName: houses[houseIndex].name,
          rawEggCount,
        }),
      ),
    );
  }
}
