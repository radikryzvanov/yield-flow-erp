import { Injectable, signal, computed } from '@angular/core';
import { FeedSilo, FeedLog } from '../interfaces/feed-warehouse.interface';

@Injectable({
  providedIn: 'root'
})
export class FeedWarehouseService {
  // Силосы оперативного запаса кормоцеха
  private readonly _silos = signal<FeedSilo[]>([
    {
      id: 'silo-1',
      name: 'Силос № 1',
      recipeCode: 'ПК-1-1',
      targetBird: 'Промышленная несушка (фаза 1, пик)',
      currentTons: 42.5,
      capacityTons: 60.0,
      costPerTonRub: 24500
    },
    {
      id: 'silo-2',
      name: 'Силос № 2',
      recipeCode: 'ПК-1-2',
      targetBird: 'Промышленная несушка (фаза 2, спад)',
      currentTons: 35.8,
      capacityTons: 60.0,
      costPerTonRub: 23200
    },
    {
      id: 'silo-3',
      name: 'Силос № 3',
      recipeCode: 'ПК-3',
      targetBird: 'Ремонтный молодняк (ростовой)',
      currentTons: 18.2,
      capacityTons: 30.0,
      costPerTonRub: 26800
    },
    {
      id: 'silo-4',
      name: 'Силос № 4',
      recipeCode: 'ПК-1-П',
      targetBird: 'Родительское стадо (племенной)',
      currentTons: 22.0,
      capacityTons: 40.0,
      costPerTonRub: 27500
    }
  ]);

  // Журнал суточных списаний на кормление
  private readonly _feedLogs = signal<FeedLog[]>([
    {
      id: 'log-1',
      date: 'Сегодня, 07:00',
      houseName: 'Птичник № 1 (Промышленная несушка)',
      recipeCode: 'ПК-1-1',
      tonsDeducted: 6.0
    },
    {
      id: 'log-2',
      date: 'Сегодня, 07:30',
      houseName: 'Птичник № 2 (Промышленная несушка)',
      recipeCode: 'ПК-1-2',
      tonsDeducted: 6.1
    }
  ]);

  readonly silos = this._silos.asReadonly();
  readonly feedLogs = this._feedLogs.asReadonly();

  // Общий остаток комбикорма на складе (в тоннах)
  readonly totalFeedTons = computed(() => {
    const total = this._silos().reduce((sum, s) => sum + s.currentTons, 0);
    return Math.round(total * 10) / 10;
  });

  // Общая стоимость кормов на балансе предприятия
  readonly totalFeedValueRub = computed(() => {
    return this._silos().reduce((sum, s) => sum + (s.currentTons * s.costPerTonRub), 0);
  });

  // Автоматическое списание корма по суточному отчёту птичника
  deductFeedForHouse(houseName: string, birdType: 'layer' | 'broiler' | 'rearing', ageDays: number, totalTons: number) {
    if (totalTons <= 0) return;

    let targetRecipe = 'ПК-1-1';
    if (birdType === 'rearing') {
      targetRecipe = 'ПК-3';
    } else if (houseName.includes('Родительское')) {
      targetRecipe = 'ПК-1-П';
    } else if (birdType === 'layer' && ageDays > 350) {
      targetRecipe = 'ПК-1-2';
    }

    this._silos.update(silos =>
      silos.map(s => {
        if (s.recipeCode === targetRecipe) {
          const updatedTons = Math.max(0, Math.round((s.currentTons - totalTons) * 100) / 100);
          return { ...s, currentTons: updatedTons };
        }
        return s;
      })
    );

    const newLog: FeedLog = {
      id: 'log-' + Date.now(),
      date: 'Только что',
      houseName: houseName,
      recipeCode: targetRecipe,
      tonsDeducted: totalTons
    };

    this._feedLogs.update(logs => [newLog, ...logs]);
  }
}