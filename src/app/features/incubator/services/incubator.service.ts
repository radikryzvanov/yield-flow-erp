import { Injectable, signal, computed } from '@angular/core';

export type IncubatorStatus = 'idle' | 'incubating' | 'hatching' | 'maintenance';

export interface IncubatorUnit {
  id: string;
  name: string;
  capacityEggs: number;
  currentEggs: number;
  status: IncubatorStatus;
  currentDay: number;
  targetTemperature: number;
  targetHumidity: number;
  batchNumber?: string;
  startDate?: string;
}

export interface HatchResult {
  id: string;
  batchNumber: string;
  date: string;
  totalEggsSet: number;
  chicksHatched: number;
  hatchabilityRate: number;
  operatorName: string;
}

export interface CreateIncubationDto {
  unitId: string;
  batchNumber: string;
  eggsCount: number;
  operatorName: string;
}

@Injectable({
  providedIn: 'root',
})
export class IncubatorService {
  private readonly unitsSignal = signal<IncubatorUnit[]>([
    {
      id: 'inc-1',
      name: 'Шкаф инкубационный №1 (Стимул-45)',
      capacityEggs: 45000,
      currentEggs: 42000,
      status: 'incubating',
      currentDay: 14,
      targetTemperature: 37.6,
      targetHumidity: 53,
      batchNumber: 'ИНК-2026-081',
      startDate: '10.08.2026',
    },
    {
      id: 'inc-2',
      name: 'Шкаф инкубационный №2 (Стимул-45)',
      capacityEggs: 45000,
      currentEggs: 44500,
      status: 'incubating',
      currentDay: 19,
      targetTemperature: 37.2,
      targetHumidity: 65,
      batchNumber: 'ИНК-2026-079',
      startDate: '05.08.2026',
    },
    {
      id: 'inc-3',
      name: 'Шкаф инкубационный №3 (Стимул-45)',
      capacityEggs: 45000,
      currentEggs: 0,
      status: 'idle',
      currentDay: 0,
      targetTemperature: 37.5,
      targetHumidity: 55,
    },
  ]);

  private readonly hatchHistorySignal = signal<HatchResult[]>([
    {
      id: 'hatch-1',
      batchNumber: 'ИНК-2026-075',
      date: '18.08.2026',
      totalEggsSet: 45000,
      chicksHatched: 39600,
      hatchabilityRate: 88.0,
      operatorName: 'Иванова Е. С.',
    },
    {
      id: 'hatch-2',
      batchNumber: 'ИНК-2026-072',
      date: '12.08.2026',
      totalEggsSet: 44000,
      chicksHatched: 39160,
      hatchabilityRate: 89.0,
      operatorName: 'Ковалев Д. И.',
    },
  ]);

  readonly units = this.unitsSignal.asReadonly();
  readonly hatchHistory = this.hatchHistorySignal.asReadonly();

  readonly totalEggsInIncubation = computed(() => {
    return this.unitsSignal().reduce((sum, u) => sum + u.currentEggs, 0);
  });

  readonly averageHatchability = computed(() => {
    const history = this.hatchHistorySignal();
    if (history.length === 0) return 0;
    const totalRate = history.reduce((sum, h) => sum + h.hatchabilityRate, 0);
    return Number((totalRate / history.length).toFixed(1));
  });

  startIncubation(dto: CreateIncubationDto): void {
    this.unitsSignal.update((units) =>
      units.map((unit) => {
        if (unit.id === dto.unitId) {
          return {
            ...unit,
            currentEggs: dto.eggsCount,
            status: 'incubating',
            currentDay: 1,
            batchNumber: dto.batchNumber,
            startDate: new Date().toLocaleDateString('ru-RU'),
          };
        }
        return unit;
      })
    );
  }
}