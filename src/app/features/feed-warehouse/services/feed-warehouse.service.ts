import { Injectable, computed } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';
import { FeedSilo, FeedLog } from '../interfaces/feed-warehouse.interface';

@Injectable({
  providedIn: 'root'
})
export class FeedWarehouseService {
  // Силосы оперативного запаса кормоцеха с автосохранением в localStorage
  private readonly _silos = persistedSignal<FeedSilo[]>('yieldflow_feed_silos', [
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

  // Журнал суточных списаний с автосохранением в localStorage
  private readonly _feedLogs = persistedSignal<FeedLog[]>('yieldflow_feed_logs', [
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

  // Общая вместимость силосов кормоцеха
  readonly totalCapacityTons = computed(() => {
    return this._silos().reduce((sum, s) => sum + s.capacityTons, 0);
  });

  // Общая стоимость кормов на балансе предприятия
  readonly totalFeedValueRub = computed(() => {
    return this._silos().reduce((sum, s) => sum + (s.currentTons * s.costPerTonRub), 0);
  });

  // Автоматическое списание корма по суточному отчёту птичника
  deductFeedForHouse(
    houseName: string,
    birdType: 'layer' | 'broiler' | 'rearing',
    ageDays: number,
    totalTons: number
  ): boolean {
    if (totalTons <= 0) return false;

    // 1. Определение целевого рецепта по зоотехническим правилам
    let targetRecipe = 'ПК-1-1';
    if (birdType === 'rearing') {
      targetRecipe = 'ПК-3';
    } else if (houseName.toLowerCase().includes('родительское')) {
      targetRecipe = 'ПК-1-П';
    } else if (birdType === 'layer' && ageDays > 350) {
      targetRecipe = 'ПК-1-2';
    }

    // 2. Поиск подходящего силоса с ненулевым запасом
    const currentSilos = this._silos();
    const targetSiloIndex = currentSilos.findIndex(
      s => s.recipeCode === targetRecipe && s.currentTons > 0
    );

    if (targetSiloIndex === -1) {
      console.warn(`[FeedWarehouse] Корм рецепта ${targetRecipe} отсутствует на складе!`);
      return false;
    }

    const silo = currentSilos[targetSiloIndex];
    const actualDeducted = Math.min(silo.currentTons, totalTons);
    const updatedTons = Math.round((silo.currentTons - actualDeducted) * 100) / 100;

    // 3. Обновление остатка только в конкретном силосе
    this._silos.update(silos => {
      const updated = [...silos];
      updated[targetSiloIndex] = { ...silo, currentTons: updatedTons };
      return updated;
    });

    // 4. Запись в журнал только фактически списанного объема
    const timeFormatted = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());

    const newLog: FeedLog = {
      id: `log-${Date.now()}`,
      date: `Сегодня, ${timeFormatted}`,
      houseName: houseName,
      recipeCode: targetRecipe,
      tonsDeducted: Math.round(actualDeducted * 100) / 100
    };

    this._feedLogs.update(logs => [newLog, ...logs]);
    return actualDeducted === totalTons;
  }

  // Пополнение силоса (приготовление партии или приёмка с линии)
  replenishSilo(siloId: string, tonsToAdd: number): boolean {
    const tons = Number(tonsToAdd);
    if (isNaN(tons) || tons <= 0) return false;

    let updated = false;

    this._silos.update(silos =>
      silos.map(s => {
        if (s.id === siloId) {
          const availableSpace = s.capacityTons - s.currentTons;
          if (availableSpace <= 0) return s;

          const toAdd = Math.min(tons, availableSpace);
          const newCurrentTons = Math.round((s.currentTons + toAdd) * 100) / 100;
          updated = true;
          return { ...s, currentTons: newCurrentTons };
        }
        return s;
      })
    );

    return updated;
  }
}