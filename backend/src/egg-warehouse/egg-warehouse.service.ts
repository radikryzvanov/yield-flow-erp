import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { House } from '../houses/house.entity.js';
import { EggBatch, EggBatchStatus } from './egg-batch.entity.js';
import { CATEGORY_DESCRIPTIONS, distributeSorting } from './egg-sorting.js';
import { EggStock } from './egg-stock.entity.js';
import { RegisterBatchDto } from './dto/register-batch.dto.js';
import { WarehouseSummaryDto } from './dto/warehouse-summary.dto.js';

@Injectable()
export class EggWarehouseService {
  constructor(
    @InjectRepository(EggBatch) private readonly batches: Repository<EggBatch>,
    @InjectRepository(EggStock) private readonly stocks: Repository<EggStock>,
    @InjectRepository(House) private readonly houses: Repository<House>,
    private readonly dataSource: DataSource,
  ) {}

  listBatches(status?: EggBatchStatus): Promise<EggBatch[]> {
    return this.batches.find({
      where: status ? { status } : {},
      order: { receivedAt: 'DESC' },
    });
  }

  listStocks(): Promise<EggStock[]> {
    return this.stocks.find({ order: { category: 'ASC' } });
  }

  async summary(): Promise<WarehouseSummaryDto> {
    const stock = await this.stocks
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.count), 0)', 'total')
      .getRawOne<{ total: string }>();
    const pending = await this.batches
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.rawEggCount), 0)', 'total')
      .where('b.status = :status', { status: EggBatchStatus.Pending })
      .getRawOne<{ total: string }>();

    // SUM в PostgreSQL приходит строкой, поэтому приводим к числу.
    return {
      totalStockEggs: Number(stock?.total ?? 0),
      totalPendingRawEggs: Number(pending?.total ?? 0),
    };
  }

  /** Приёмка валового яйца из птичника. */
  async registerBatch(dto: RegisterBatchDto): Promise<EggBatch> {
    const house = await this.houses.findOne({ where: { id: dto.houseId } });
    if (!house) throw new NotFoundException('Птичник не найден');

    return this.batches.save(
      this.batches.create({
        houseId: house.id,
        houseName: house.name,
        rawEggCount: dto.rawEggCount,
      }),
    );
  }

  /**
   * Сортировка партии — одна транзакция из трёх действий:
   * 1) заблокировать партию, 2) добавить яйца в остатки, 3) пометить партию рассортированной.
   * Либо выполнится всё, либо ничего. Блокировка защищает от двойного нажатия:
   * второй запрос подождёт, увидит статус «рассортирована» и получит 409.
   */
  sortBatch(batchId: string): Promise<EggBatch> {
    return this.dataSource.transaction(async (em) => {
      const batch = await em.findOne(EggBatch, {
        where: { id: batchId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!batch) throw new NotFoundException('Партия не найдена');
      if (batch.status === EggBatchStatus.Sorted) {
        throw new ConflictException('Партия уже рассортирована');
      }

      const sortedYield = distributeSorting(batch.rawEggCount);

      for (const row of sortedYield) {
        // «Добавить или увеличить» одним запросом: атомарно, без гонок между запросами.
        await em.query(
          `INSERT INTO "egg_stocks" ("category", "description", "count", "unit")
           VALUES ($1, $2, $3, 'шт')
           ON CONFLICT ("category")
           DO UPDATE SET "count" = "egg_stocks"."count" + EXCLUDED."count"`,
          [row.category, CATEGORY_DESCRIPTIONS[row.category], row.count],
        );
      }

      batch.status = EggBatchStatus.Sorted;
      batch.sortedYield = sortedYield;
      batch.sortedAt = new Date();
      return em.save(batch);
    });
  }
}
