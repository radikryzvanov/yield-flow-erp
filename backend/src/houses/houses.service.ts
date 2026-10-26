import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { BirdsCountDto } from './dto/birds-count.dto.js';
import { CreateHouseDto } from './dto/create-house.dto.js';
import { DailyReportDto } from './dto/daily-report.dto.js';
import { UpdateHouseDto } from './dto/update-house.dto.js';
import { HouseDailyReport } from './house-daily-report.entity.js';
import { BirdType, House, HouseStatus } from './house.entity.js';

/** Округление до одного знака после запятой (96.54 → 96.5). */
const round1 = (value: number) => Math.round(value * 10) / 10;

@Injectable()
export class HousesService {
  constructor(
    @InjectRepository(House) private readonly houses: Repository<House>,
    @InjectRepository(HouseDailyReport)
    private readonly reports: Repository<HouseDailyReport>,
    private readonly dataSource: DataSource,
  ) {}

  findAll(): Promise<House[]> {
    return this.houses.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<House> {
    const house = await this.houses.findOne({ where: { id } });
    if (!house) throw new NotFoundException('Птичник не найден');
    return house;
  }

  create(dto: CreateHouseDto): Promise<House> {
    const house = this.houses.create();
    Object.assign(house, dto, {
      status: dto.status ?? HouseStatus.Active,
      initialBirdCount: dto.initialBirdCount ?? dto.birdCount,
    });
    return this.houses.save(house);
  }

  async update(id: string, dto: UpdateHouseDto): Promise<House> {
    const house = await this.findOne(id);
    Object.assign(house, dto);
    return this.houses.save(house);
  }

  async remove(id: string): Promise<void> {
    const result = await this.houses.delete(id);
    if (!result.affected) throw new NotFoundException('Птичник не найден');
  }

  listReports(houseId: string, limit = 30): Promise<HouseDailyReport[]> {
    return this.reports.find({
      where: { houseId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Суточный отчёт. Всё выполняется в одной транзакции с блокировкой строки птичника:
   * если два зоотехника одновременно отправят отчёт, они пройдут по очереди,
   * и цифры не перемешаются.
   */
  addDailyReport(houseId: string, dto: DailyReportDto): Promise<House> {
    return this.dataSource.transaction(async (em) => {
      const house = await this.lockHouse(em, houseId);
      const mortality = dto.mortalityCount ?? 0;

      if (mortality > house.birdCount) {
        throw new BadRequestException(
          `Падёж (${mortality} гол.) не может превышать текущее поголовье (${house.birdCount} гол.)`,
        );
      }
      if (house.birdType !== BirdType.Layer && dto.eggCount > 0) {
        throw new BadRequestException(
          'Сбор яйца можно вносить только для птичников несушек',
        );
      }

      const newBirdCount = house.birdCount - mortality;
      if (dto.eggCount > newBirdCount) {
        throw new BadRequestException(
          'Сбор яйца не может превышать поголовье (яйценоскость выше 100%)',
        );
      }

      house.birdCount = newBirdCount;
      house.dailyEggCount = dto.eggCount;
      if (house.birdType === BirdType.Layer && newBirdCount > 0) {
        house.actualLayingRatePercent = round1(
          (dto.eggCount / newBirdCount) * 100,
        );
      }
      house.feedPerBirdGrams = dto.feedPerBirdGrams ?? house.feedPerBirdGrams;
      house.temperature = dto.temperature ?? house.temperature;
      house.humidityPercent = dto.humidityPercent ?? house.humidityPercent;
      const saved = await em.save(house);

      await em.save(
        em.create(HouseDailyReport, {
          houseId,
          eggCount: dto.eggCount,
          mortalityCount: mortality,
          feedPerBirdGrams: saved.feedPerBirdGrams,
          temperature: saved.temperature,
          humidityPercent: saved.humidityPercent,
        }),
      );
      return saved;
    });
  }

  /** Приём выведенного суточного молодняка из инкубатория. */
  receiveFlock(houseId: string, dto: BirdsCountDto): Promise<House> {
    return this.dataSource.transaction(async (em) => {
      const house = await this.lockHouse(em, houseId);
      house.birdCount += dto.birdsCount;
      house.initialBirdCount += dto.birdsCount;
      return em.save(house);
    });
  }

  /** Убытие птицы (например, отправка на убой). Не трогает сбор яиц и яйценоскость. */
  removeBirds(houseId: string, dto: BirdsCountDto): Promise<House> {
    return this.dataSource.transaction(async (em) => {
      const house = await this.lockHouse(em, houseId);
      if (dto.birdsCount > house.birdCount) {
        throw new BadRequestException(
          `Нельзя убрать ${dto.birdsCount} гол.: в птичнике сейчас ${house.birdCount} гол.`,
        );
      }
      house.birdCount -= dto.birdsCount;
      return em.save(house);
    });
  }

  /** Читает птичник и блокирует строку до конца транзакции (SELECT ... FOR UPDATE). */
  private async lockHouse(em: EntityManager, id: string): Promise<House> {
    const house = await em.findOne(House, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!house) throw new NotFoundException('Птичник не найден');
    return house;
  }
}
