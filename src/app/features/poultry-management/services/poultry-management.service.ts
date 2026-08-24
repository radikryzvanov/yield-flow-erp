import { Injectable, computed, signal } from '@angular/core';

export interface PoultryHouse {
  id: string;
  name: string;
  birdCount: number;
  initialBirdCount: number;
  ageDays: number;
  temperature: number;
  targetTemperature: number;
  status: 'active' | 'warning' | 'empty';
}

@Injectable({
  providedIn: 'root'
})
export class PoultryManagementService {
  private readonly _houses = signal<PoultryHouse[]>([
    {
      id: 'house-1',
      name: 'Птичник № 1 (Бройлер)',
      birdCount: 42500,
      initialBirdCount: 44000,
      ageDays: 28,
      temperature: 24.5,
      targetTemperature: 24.5,
      status: 'active'
    },
    {
      id: 'house-2',
      name: 'Птичник № 2 (Бройлер)',
      birdCount: 41800,
      initialBirdCount: 44000,
      ageDays: 32,
      temperature: 26.2,
      targetTemperature: 23.5,
      status: 'warning'
    },
    {
      id: 'house-3',
      name: 'Птичник № 3 (Родительское стадо)',
      birdCount: 28000,
      initialBirdCount: 29000,
      ageDays: 140,
      temperature: 20.0,
      targetTemperature: 20.0,
      status: 'active'
    },
    {
      id: 'house-4',
      name: 'Птичник № 4 (Молодняк)',
      birdCount: 35000,
      initialBirdCount: 35500,
      ageDays: 12,
      temperature: 29.0,
      targetTemperature: 29.0,
      status: 'active'
    }
  ]);

  readonly houses = this._houses.asReadonly();

  readonly totalBirds = computed(() =>
    this._houses().reduce((sum, h) => sum + h.birdCount, 0)
  );

  readonly activeHousesCount = computed(() =>
    this._houses().filter(h => h.status !== 'empty').length
  );

  readonly averageSurvivalRate = computed(() => {
    const list = this._houses().filter(h => h.initialBirdCount > 0);
    if (list.length === 0) return 0;
    const totalCurrent = list.reduce((sum, h) => sum + h.birdCount, 0);
    const totalInitial = list.reduce((sum, h) => sum + h.initialBirdCount, 0);
    return Math.round((totalCurrent / totalInitial) * 1000) / 10;
  });
}