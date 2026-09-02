import { Injectable, computed } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';

export interface PoultryHouse {
  id: string;
  name: string;
  birdType: 'layer' | 'broiler' | 'rearing';
  crossType: string;
  ageDays: number;
  status: 'active' | 'quarantine' | 'cleaning';
  birdCount: number;
  initialBirdCount: number;
  dailyEggCount: number;
  actualLayingRatePercent: number;
  targetLayingRatePercent: number;
  feedPerBirdGrams: number;
  targetFeedGrams: number;
  temperature: number;
  targetTemperature: number;
  humidityPercent: number;
  [key: string]: any;
}

export interface DailyReportInput {
  houseId: string;
  dailyEggCount?: number;
  eggCount?: number;
  mortalityCount?: number;
  mortality?: number;
  feedPerBirdGrams?: number;
  feedKg?: number;
  temperature?: number;
  targetTemperature?: number;
  humidityPercent?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class PoultryManagementService {
  private readonly _houses = persistedSignal<PoultryHouse[]>('yieldflow_poultry_houses', [
    {
      id: 'house-1',
      name: 'Птичник № 1 (Промышленная несушка)',
      birdType: 'layer',
      crossType: 'Ломанн Браун',
      ageDays: 196,
      status: 'active',
      birdCount: 52000,
      initialBirdCount: 53500,
      dailyEggCount: 50199,
      actualLayingRatePercent: 96.5,
      targetLayingRatePercent: 95.0,
      feedPerBirdGrams: 118,
      targetFeedGrams: 115,
      temperature: 21.4,
      targetTemperature: 21.0,
      humidityPercent: 62
    },
    {
      id: 'house-2',
      name: 'Птичник № 2 (Промышленная несушка)',
      birdType: 'layer',
      crossType: 'Декалб Белый',
      ageDays: 238,
      status: 'active',
      birdCount: 43200,
      initialBirdCount: 44000,
      dailyEggCount: 41035,
      actualLayingRatePercent: 95.0,
      targetLayingRatePercent: 94.0,
      feedPerBirdGrams: 116,
      targetFeedGrams: 115,
      temperature: 20.8,
      targetTemperature: 21.0,
      humidityPercent: 65
    },
    {
      id: 'house-3',
      name: 'Птичник № 3 (Ремонтный молодняк)',
      birdType: 'rearing',
      crossType: 'Ломанн Браун',
      ageDays: 84,
      status: 'active',
      birdCount: 38000,
      initialBirdCount: 38500,
      dailyEggCount: 0,
      actualLayingRatePercent: 0,
      targetLayingRatePercent: 0,
      feedPerBirdGrams: 75,
      targetFeedGrams: 75,
      temperature: 22.5,
      targetTemperature: 22.0,
      humidityPercent: 58
    },
    {
      id: 'house-4',
      name: 'Птичник № 4 (Мясной бройлер)',
      birdType: 'broiler',
      crossType: 'Росс 308',
      ageDays: 35,
      status: 'active',
      birdCount: 22000,
      initialBirdCount: 22400,
      dailyEggCount: 0,
      actualLayingRatePercent: 0,
      targetLayingRatePercent: 0,
      feedPerBirdGrams: 155,
      targetFeedGrams: 155,
      temperature: 21.0,
      targetTemperature: 21.0,
      humidityPercent: 60
    }
  ]);

  readonly houses = this._houses.asReadonly();

  // Сигналы, которые требует PoultryListComponent
  readonly totalBirds = computed(() =>
    this._houses().reduce((sum, h) => sum + h.birdCount, 0)
  );

  // Сигналы, которые требуют PoultryListComponent и FinanceService
  readonly totalDailyEggs = computed(() =>
    this._houses().reduce((sum, h) => sum + h.dailyEggCount, 0)
  );

  readonly totalDailyFeedTons = computed(() => {
    const totalKg = this._houses().reduce(
      (sum, h) => sum + (h.birdCount * h.feedPerBirdGrams) / 1000,
      0
    );
    return +(totalKg / 1000).toFixed(1);
  });

  readonly averageLayingRate = computed(() => {
    const layers = this._houses().filter(h => h.birdType === 'layer');
    if (layers.length === 0) return 0;
    const avg = layers.reduce((sum, h) => sum + h.actualLayingRatePercent, 0) / layers.length;
    return +avg.toFixed(1);
  });

  // Метод внесения сменного отчета из формы poultry-list
  submitDailyReport(report: DailyReportInput): void {
    const eggs = report.dailyEggCount ?? report.eggCount ?? 0;
    const mortality = report.mortalityCount ?? report.mortality ?? 0;

    this._houses.update(houses =>
      houses.map(h => {
        if (h.id === report.houseId) {
          const newBirdCount = Math.max(0, h.birdCount - mortality);
          const newRate =
            newBirdCount > 0 && h.birdType === 'layer'
              ? +((eggs / newBirdCount) * 100).toFixed(1)
              : h.actualLayingRatePercent;

          return {
            ...h,
            ...report,
            birdCount: newBirdCount,
            dailyEggCount: eggs,
            actualLayingRatePercent: newRate,
            feedPerBirdGrams: report.feedPerBirdGrams ?? h.feedPerBirdGrams,
            temperature: report.temperature ?? h.temperature
          };
        }
        return h;
      })
    );
  }
}