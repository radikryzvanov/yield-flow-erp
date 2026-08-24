import { Injectable, computed, signal } from '@angular/core';
import {
  IncubationCabinet,
  IncubationBatch,
  HatchHistoryRecord,
  StartIncubationPayload
} from '../interfaces/incubator.interface';

@Injectable({
  providedIn: 'root'
})
export class IncubatorService {
  private readonly _cabinets = signal<IncubationCabinet[]>([
    {
      id: 'cab-01',
      name: 'Шкаф инкубационный № 1 (Petersime)',
      type: 'setter',
      capacityEggs: 57600,
      currentEggs: 57600,
      currentDay: 12,
      temperatureCelsius: 37.6,
      targetTempCelsius: 37.6,
      humidityPercent: 53,
      targetHumidityPercent: 53,
      eggTurningActive: true,
      status: 'active'
    },
    {
      id: 'cab-02',
      name: 'Шкаф инкубационный № 2 (Petersime)',
      type: 'setter',
      capacityEggs: 57600,
      currentEggs: 57600,
      currentDay: 18,
      temperatureCelsius: 37.8,
      targetTempCelsius: 37.5,
      humidityPercent: 58,
      targetHumidityPercent: 54,
      eggTurningActive: true,
      status: 'warning'
    },
    {
      id: 'cab-03',
      name: 'Шкаф выводной № 1 (Hatcher)',
      type: 'hatcher',
      capacityEggs: 19200,
      currentEggs: 18500,
      currentDay: 20,
      temperatureCelsius: 36.8,
      targetTempCelsius: 36.8,
      humidityPercent: 72,
      targetHumidityPercent: 72,
      eggTurningActive: false,
      status: 'active'
    },
    {
      id: 'cab-04',
      name: 'Шкаф выводной № 2 (Hatcher)',
      type: 'hatcher',
      capacityEggs: 19200,
      currentEggs: 0,
      currentDay: 0,
      temperatureCelsius: 22.0,
      targetTempCelsius: 36.8,
      humidityPercent: 40,
      targetHumidityPercent: 70,
      eggTurningActive: false,
      status: 'empty'
    }
  ]);

  private readonly _batches = signal<IncubationBatch[]>([
    {
      id: 'ib-101',
      batchNumber: 'ИНК-2026-14',
      eggSourceHouse: 'Птичник № 2 (Родительское стадо)',
      eggsSetCount: 57600,
      startDate: '2026-08-04',
      plannedHatchDate: '2026-08-25',
      cabinetId: 'cab-03',
      stage: 'hatching',
      expectedHatchRatePercent: 86.5
    },
    {
      id: 'ib-102',
      batchNumber: 'ИНК-2026-15',
      eggSourceHouse: 'Птичник № 1',
      eggsSetCount: 57600,
      startDate: '2026-08-12',
      plannedHatchDate: '2026-09-02',
      cabinetId: 'cab-01',
      stage: 'setting',
      expectedHatchRatePercent: 88.0
    }
  ]);

  private readonly _hatchHistory = signal<HatchHistoryRecord[]>([
    {
      id: 'hh-1',
      batchNumber: 'ИНК-2026-12',
      date: '2026-08-10',
      eggsSet: 57600,
      chicksHatched: 50400,
      hatchRatePercent: 87.5
    },
    {
      id: 'hh-2',
      batchNumber: 'ИНК-2026-13',
      date: '2026-08-17',
      eggsSet: 57600,
      chicksHatched: 49824,
      hatchRatePercent: 86.5
    }
  ]);

  readonly cabinets = this._cabinets.asReadonly();
  readonly batches = this._batches.asReadonly();
  readonly hatchHistory = this._hatchHistory.asReadonly();

  readonly totalEggsInIncubation = computed(() =>
    this._cabinets().reduce((sum, cab) => sum + cab.currentEggs, 0)
  );

  readonly warningCabinetsCount = computed(() =>
    this._cabinets().filter(cab => cab.status === 'warning').length
  );

  readonly activeSettersCount = computed(() =>
    this._cabinets().filter(cab => cab.type === 'setter' && cab.status !== 'empty').length
  );

  readonly averageHatchability = computed(() => {
    const history = this._hatchHistory();
    if (history.length === 0) return 0;
    const total = history.reduce((sum, item) => sum + item.hatchRatePercent, 0);
    return Math.round((total / history.length) * 10) / 10;
  });

  startIncubation(payload: StartIncubationPayload): void {
    this._cabinets.update(list =>
      list.map(cab =>
        cab.id === payload.cabinetId
          ? {
              ...cab,
              currentEggs: payload.eggsCount,
              currentDay: 1,
              status: 'active' as const
            }
          : cab
      )
    );

    const newBatch: IncubationBatch = {
      id: `ib-${Date.now()}`,
      batchNumber: payload.batchNumber,
      eggSourceHouse: payload.eggSourceHouse,
      eggsSetCount: payload.eggsCount,
      startDate: new Date().toISOString().split('T')[0],
      plannedHatchDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
      cabinetId: payload.cabinetId,
      stage: 'setting',
      expectedHatchRatePercent: 87.0
    };

    this._batches.update(list => [...list, newBatch]);
  }
}