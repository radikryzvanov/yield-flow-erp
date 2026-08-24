import { Injectable, computed, signal } from '@angular/core';

export interface BunkerItem {
  id: string;
  name: string;
  recipeName: string;
  capacityTons: number;
  currentTons: number;
}

export interface FeedRecipe {
  id: string;
  code: string;
  name: string;
  targetGroup: string;
  costPerKgRub: number;
}

export interface FeedMovementLog {
  id: string;
  dateTime: string;
  type: 'income' | 'outcome';
  recipeName: string;
  amountTons: number;
  destination: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedWarehouseService {
  private readonly _bunkers = signal<BunkerItem[]>([
    { id: 'bunker-1', name: 'Бункер комбикорма № 1', recipeName: 'ПК-5 Старт (Бройлер)', capacityTons: 50, currentTons: 42 },
    { id: 'bunker-2', name: 'Бункер комбикорма № 2', recipeName: 'ПК-6 Рост (Бройлер)', capacityTons: 60, currentTons: 11 },
    { id: 'bunker-3', name: 'Бункер комбикорма № 3', recipeName: 'ПК-1 Несушка Профи', capacityTons: 50, currentTons: 38 },
    { id: 'bunker-4', name: 'Бункер комбикорма № 4', recipeName: 'Финиш (Бройлер)', capacityTons: 60, currentTons: 54 }
  ]);

  private readonly _recipes = signal<FeedRecipe[]>([
    { id: 'rec-1', code: 'ПК-5', name: 'Старт (0-10 дней)', targetGroup: 'Цыплята-бройлеры', costPerKgRub: 38.5 },
    { id: 'rec-2', code: 'ПК-6', name: 'Рост (11-24 дня)', targetGroup: 'Цыплята-бройлеры', costPerKgRub: 35.2 },
    { id: 'rec-3', code: 'ПК-1', name: 'Несушка Фаза 1', targetGroup: 'Промышленная несушка', costPerKgRub: 29.8 }
  ]);

  private readonly _movementLogs = signal<FeedMovementLog[]>([
    { id: 'log-1', dateTime: '2026-08-24 08:30', type: 'outcome', recipeName: 'ПК-5 Старт', amountTons: 4.5, destination: 'Птичник № 1' },
    { id: 'log-2', dateTime: '2026-08-24 10:15', type: 'outcome', recipeName: 'ПК-6 Рост', amountTons: 6.2, destination: 'Птичник № 2' },
    { id: 'log-3', dateTime: '2026-08-24 13:00', type: 'income', recipeName: 'ПК-1 Несушка', amountTons: 15.0, destination: 'Бункер № 3' }
  ]);

  readonly bunkers = this._bunkers.asReadonly();
  readonly recipes = this._recipes.asReadonly();
  readonly movementLogs = this._movementLogs.asReadonly();

  readonly totalStockTons = computed(() =>
    this._bunkers().reduce((acc, b) => acc + b.currentTons, 0)
  );

  readonly dailyConsumptionTons = computed(() => 14.5);

  readonly daysOfSupply = computed(() => {
    const daily = this.dailyConsumptionTons();
    if (daily <= 0) return 0;
    return Math.floor(this.totalStockTons() / daily);
  });
}