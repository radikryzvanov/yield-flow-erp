import { Injectable, signal, computed } from '@angular/core';

export interface PoultryHouse {
  id: string;
  name: string;
  crossType: string;             // Кросс: например, Ломанн ЛСЛ, Хайсекс Браун, Кобб-500
  birdType: 'layer' | 'broiler' | 'rearing'; // Несушка, Бройлер, Молодняк
  birdCount: number;
  initialBirdCount: number;
  ageDays: number;
  temperature: number;
  targetTemperature: number;

  // Зоотехнические нормативы и факт
  targetLayingRatePercent: number; // Нормативный % яйценоскости кросса
  actualLayingRatePercent: number; // Фактический % яйценоскости
  dailyEggCount: number;           // Сбор яиц за сутки (шт.)
  feedPerBirdGrams: number;        // Расход корма (грамм на голову в сутки)
  targetFeedGrams: number;         // Норма корма на голову
  status: 'active' | 'quarantine' | 'empty';
}

@Injectable({
  providedIn: 'root'
})
export class PoultryManagementService {
  private readonly _houses = signal<PoultryHouse[]>([
    {
      id: 'house-1',
      name: 'Птичник № 1 (Промышленная несушка)',
      crossType: 'Ломанн ЛСЛ Классик',
      birdType: 'layer',
      birdCount: 52400,
      initialBirdCount: 53000,
      ageDays: 238, // 34 недели - пик продуктивности
      temperature: 20.5,
      targetTemperature: 20.0,
      targetLayingRatePercent: 96.2,
      actualLayingRatePercent: 95.8,
      dailyEggCount: 50199,
      feedPerBirdGrams: 115,
      targetFeedGrams: 114,
      status: 'active'
    },
    {
      id: 'house-2',
      name: 'Птичник № 2 (Промышленная несушка)',
      crossType: 'Декалб Белый',
      birdType: 'layer',
      birdCount: 49800,
      initialBirdCount: 51000,
      ageDays: 441, // 63 недели - плановый спад
      temperature: 23.8, // Перегрев
      targetTemperature: 20.0,
      targetLayingRatePercent: 88.0,
      actualLayingRatePercent: 82.4, // Просадка из-за микроклимата
      dailyEggCount: 41035,
      feedPerBirdGrams: 122,
      targetFeedGrams: 116,
      status: 'active'
    },
    {
      id: 'house-3',
      name: 'Птичник № 3 (Ремонтный молодняк)',
      crossType: 'Ломанн ЛСЛ Классик',
      birdType: 'rearing',
      birdCount: 35000,
      initialBirdCount: 35500,
      ageDays: 70, // 10 недель (период активного роста скелета)
      temperature: 22.0,
      targetTemperature: 22.0,
      targetLayingRatePercent: 0,
      actualLayingRatePercent: 0,
      dailyEggCount: 0,
      feedPerBirdGrams: 68,
      targetFeedGrams: 68,
      status: 'active'
    },
    {
      id: 'house-4',
      name: 'Птичник № 4 (Родительское стадо)',
      crossType: 'Хайсекс Браун',
      birdType: 'layer',
      birdCount: 28000,
      initialBirdCount: 28500,
      ageDays: 196, // 28 недель (инкубационное яйцо)
      temperature: 20.2,
      targetTemperature: 20.0,
      targetLayingRatePercent: 92.5,
      actualLayingRatePercent: 92.8,
      dailyEggCount: 25984,
      feedPerBirdGrams: 118,
      targetFeedGrams: 118,
      status: 'active'
    }
  ]);

  readonly houses = this._houses.asReadonly();

  readonly totalBirds = computed(() =>
    this._houses().reduce((sum, h) => sum + h.birdCount, 0)
  );

  readonly totalDailyEggs = computed(() =>
    this._houses().reduce((sum, h) => sum + h.dailyEggCount, 0)
  );

  readonly totalDailyFeedTons = computed(() => {
    const totalGrams = this._houses().reduce(
      (sum, h) => sum + (h.birdCount * h.feedPerBirdGrams),
      0
    );
    return Math.round((totalGrams / 1_000_000) * 10) / 10;
  });

  readonly averageLayingRate = computed(() => {
    const layerHouses = this._houses().filter(h => h.birdType === 'layer' && h.status === 'active');
    if (layerHouses.length === 0) return 0;
    const totalRate = layerHouses.reduce((sum, h) => sum + h.actualLayingRatePercent, 0);
    return Math.round((totalRate / layerHouses.length) * 10) / 10;
  });

  submitDailyReport(report: {
    houseId: string;
    mortalityCount: number;
    dailyEggCount: number;
    feedPerBirdGrams: number;
    temperature: number;
  }) {
    this._houses.update(houses =>
      houses.map(house => {
        if (house.id !== report.houseId) return house;

        const newBirdCount = Math.max(0, house.birdCount - report.mortalityCount);
        const calculatedLayingRate = newBirdCount > 0 && house.birdType === 'layer'
          ? Math.round((report.dailyEggCount / newBirdCount) * 1000) / 10
          : house.actualLayingRatePercent;

        return {
          ...house,
          birdCount: newBirdCount,
          dailyEggCount: report.dailyEggCount,
          feedPerBirdGrams: report.feedPerBirdGrams,
          temperature: report.temperature,
          actualLayingRatePercent: calculatedLayingRate,
          ageDays: house.ageDays + 1
        };
      })
    );
  }
}