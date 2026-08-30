import { Injectable, signal, computed, inject } from '@angular/core';
import { ElevatorService } from '../../elevator/services/elevator.service';

export interface FeedRecipe {
  id: string;
  code: string;            // ПК-1-1 (Несушка пик), ПК-2 (Старт молодняк), ПК-5 (Бройлер)
  name: string;
  targetGroup: string;
  costPerKgRub: number;
  composition: {
    culture: string;
    targetSiloId: string;  // Из какого силоса элеватора брать
    percentage: number;
  }[];
}

export interface FeedBatchLog {
  id: string;
  timestamp: string;
  recipeCode: string;
  recipeName: string;
  producedTons: number;
  targetHouse: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedWarehouseService {
  private readonly elevatorService = inject(ElevatorService);

  private readonly _recipes = signal<FeedRecipe[]>([
    {
      id: 'rec-1',
      code: 'ПК-1-1',
      name: 'Рацион несушки (Период 20–45 нед)',
      targetGroup: 'Промышленное стадо (Птичники № 1, 2)',
      costPerKgRub: 21.80,
      composition: [
        { culture: 'Пшеница фуражная (5 класс)', targetSiloId: 'silo-1', percentage: 55 },
        { culture: 'Кукуруза кормовая', targetSiloId: 'silo-2', percentage: 15 },
        { culture: 'Шрот подсолнечный', targetSiloId: 'silo-3', percentage: 18 },
        { culture: 'Известняковая мука (ракушка)', targetSiloId: 'silo-4', percentage: 9 },
        { culture: 'Премикс / витамины 1%', targetSiloId: '', percentage: 3 }
      ]
    },
    {
      id: 'rec-2',
      code: 'ПК-2',
      name: 'Стартовый рацион для молодняка (1–8 нед)',
      targetGroup: 'Ремонтный молодняк (Птичник № 3)',
      costPerKgRub: 26.50,
      composition: [
        { culture: 'Пшеница фуражная (5 класс)', targetSiloId: 'silo-1', percentage: 48 },
        { culture: 'Кукуруза кормовая', targetSiloId: 'silo-2', percentage: 22 },
        { culture: 'Шрот подсолнечный', targetSiloId: 'silo-3', percentage: 24 },
        { culture: 'Известняковая мука (ракушка)', targetSiloId: 'silo-4', percentage: 2 },
        { culture: 'Премикс / аминокислоты', targetSiloId: '', percentage: 4 }
      ]
    },
    {
      id: 'rec-3',
      code: 'ПК-1-2',
      name: 'Рацион родительского стада',
      targetGroup: 'Племстадо / инкубационное яйцо (Птичник № 4)',
      costPerKgRub: 24.30,
      composition: [
        { culture: 'Пшеница фуражная (5 класс)', targetSiloId: 'silo-1', percentage: 50 },
        { culture: 'Кукуруза кормовая', targetSiloId: 'silo-2', percentage: 20 },
        { culture: 'Шрот подсолнечный', targetSiloId: 'silo-3', percentage: 18 },
        { culture: 'Известняковая мука (ракушка)', targetSiloId: 'silo-4', percentage: 8 },
        { culture: 'Премикс репродуктивный', targetSiloId: '', percentage: 4 }
      ]
    }
  ]);

  private readonly _batchLogs = signal<FeedBatchLog[]>([
    {
      id: 'batch-101',
      timestamp: 'Сегодня, 06:00',
      recipeCode: 'ПК-1-1',
      recipeName: 'Рацион несушки (Период 20–45 нед)',
      producedTons: 12.0,
      targetHouse: 'Птичник № 1'
    },
    {
      id: 'batch-102',
      timestamp: 'Сегодня, 09:30',
      recipeCode: 'ПК-2',
      recipeName: 'Стартовый рацион для молодняка',
      producedTons: 4.5,
      targetHouse: 'Птичник № 3'
    }
  ]);

  readonly recipes = this._recipes.asReadonly();
  readonly batchLogs = this._batchLogs.asReadonly();

  readonly totalProducedTodayTons = computed(() =>
    this._batchLogs().reduce((sum, b) => sum + b.producedTons, 0)
  );

  readonly availableSilos = computed(() => this.elevatorService.silos());

  produceFeedBatch(recipeCode: string, tons: number, targetHouse: string): boolean {
    const recipe = this._recipes().find(r => r.code === recipeCode);
    if (!recipe || tons <= 0) return false;

    // Списание сырья из элеватора
    recipe.composition.forEach(comp => {
      if (comp.targetSiloId) {
        const consumedTons = (tons * comp.percentage) / 100;
        this.elevatorService.receiveGrain({
          truckNumber: `Списание в кормоцех (${recipeCode})`,
          culture: comp.culture,
          weightTons: -consumedTons, // списываем вес со знаком минус
          moisturePercent: 12.0,
          targetSiloId: comp.targetSiloId
        });
      }
    });

    // Добавляем запись в журнал замесов
    this._batchLogs.update(logs => [
      {
        id: `batch-${Date.now()}`,
        timestamp: 'Только что',
        recipeCode: recipe.code,
        recipeName: recipe.name,
        producedTons: tons,
        targetHouse
      },
      ...logs
    ]);

    return true;
  }
}