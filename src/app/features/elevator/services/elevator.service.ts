import { Injectable, signal, computed } from '@angular/core';
import { GrainSilo, GrainIntakeLog } from '../interfaces/elevator.interface';

@Injectable({
  providedIn: 'root'
})
export class ElevatorService {
  private readonly _silos = signal<GrainSilo[]>([
    {
      id: 'silo-1',
      name: 'Силос № 1 (Север)',
      culture: 'Пшеница фуражная (5 класс)',
      capacityTons: 1500,
      currentTons: 1240,
      moisturePercent: 13.2,
      temperatureC: 18.5,
      status: 'normal'
    },
    {
      id: 'silo-2',
      name: 'Силос № 2 (Север)',
      culture: 'Кукуруза кормовая',
      capacityTons: 1500,
      currentTons: 980,
      moisturePercent: 15.4,
      temperatureC: 22.1,
      status: 'drying_required'
    },
    {
      id: 'silo-3',
      name: 'Силос № 3 (Юг)',
      culture: 'Шрот подсолнечный',
      capacityTons: 800,
      currentTons: 610,
      moisturePercent: 9.8,
      temperatureC: 16.0,
      status: 'normal'
    },
    {
      id: 'silo-4',
      name: 'Силос № 4 (Юг)',
      culture: 'Известняковая мука (ракушка)',
      capacityTons: 500,
      currentTons: 420,
      moisturePercent: 2.0,
      temperatureC: 15.0,
      status: 'normal'
    }
  ]);

  private readonly _intakeLogs = signal<GrainIntakeLog[]>([
    {
      id: 'log-1',
      date: 'Сегодня, 08:30',
      truckNumber: 'Е 741 КХ 73',
      culture: 'Пшеница фуражная (5 класс)',
      weightTons: 32.5,
      moisturePercent: 13.0,
      targetSiloId: 'silo-1'
    },
    {
      id: 'log-2',
      date: 'Сегодня, 10:15',
      truckNumber: 'О 912 ММ 73',
      culture: 'Кукуруза кормовая',
      weightTons: 28.0,
      moisturePercent: 15.6,
      targetSiloId: 'silo-2'
    }
  ]);

  readonly silos = this._silos.asReadonly();
  readonly intakeLogs = this._intakeLogs.asReadonly();

  readonly totalStoredTons = computed(() =>
    this._silos().reduce((acc, item) => acc + item.currentTons, 0)
  );

  readonly totalCapacityTons = computed(() =>
    this._silos().reduce((acc, item) => acc + item.capacityTons, 0)
  );

  readonly silosRequiringAttention = computed(() =>
    this._silos().filter(s => s.status !== 'normal').length
  );

  receiveGrain(data: { truckNumber: string; culture: string; weightTons: number; moisturePercent: number; targetSiloId: string }): void {
    const weight = Number(data.weightTons) || 0;
    const moisture = Number(data.moisturePercent) || 0;

    this._silos.update(silos =>
      silos.map(silo => {
        if (silo.id === data.targetSiloId) {
          const newWeight = Math.min(silo.capacityTons, silo.currentTons + weight);
          const status = moisture > 14.5 ? 'drying_required' : 'normal';
          return { ...silo, currentTons: newWeight, moisturePercent: moisture, status };
        }
        return silo;
      })
    );

    this._intakeLogs.update(logs => [
      {
        id: `log-${Date.now()}`,
        date: 'Только что',
        truckNumber: data.truckNumber,
        culture: data.culture,
        weightTons: weight,
        moisturePercent: moisture,
        targetSiloId: data.targetSiloId
      },
      ...logs
    ]);
  }
}