import { Injectable, computed, signal } from '@angular/core';

export interface EggCategory {
  id: string;
  code: string;
  name: string;
  countInStock: number;
  reservedCount: number;
}

export interface IncomingEggLog {
  id: string;
  date: string;
  shift: string;
  houseName: string;
  totalCollected: number;
  commercialGrade: number;
  damagedCount: number;
}

export interface ReceiveEggPayload {
  houseName: string;
  totalCount: number;
  damagedCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class EggWarehouseService {
  private readonly _categories = signal<EggCategory[]>([
    { id: 'cat-c0', code: 'С0', name: 'Отборное яйцо (65–74.9 г)', countInStock: 85400, reservedCount: 15000 },
    { id: 'cat-c1', code: 'С1', name: 'Первая категория (55–64.9 г)', countInStock: 142000, reservedCount: 22000 },
    { id: 'cat-c2', code: 'С2', name: 'Вторая категория (45–54.9 г)', countInStock: 38200, reservedCount: 5000 },
    { id: 'cat-inc', code: 'ИНК', name: 'Инкубационное яйцо', countInStock: 115200, reservedCount: 57600 }
  ]);

  private readonly _incomingLogs = signal<IncomingEggLog[]>([
    {
      id: 'egg-log-1',
      date: '2026-08-24',
      shift: 'Дневная',
      houseName: 'Птичник № 1',
      totalCollected: 45000,
      commercialGrade: 44100,
      damagedCount: 900
    },
    {
      id: 'egg-log-2',
      date: '2026-08-24',
      shift: 'Дневная',
      houseName: 'Птичник № 2',
      totalCollected: 48000,
      commercialGrade: 47040,
      damagedCount: 960
    }
  ]);

  readonly categories = this._categories.asReadonly();
  readonly incomingLogs = this._incomingLogs.asReadonly();

  readonly totalEggsInStock = computed(() =>
    this._categories().reduce((sum, cat) => sum + cat.countInStock, 0)
  );

  readonly todaySortedCount = computed(() =>
    this._incomingLogs().reduce((sum, log) => sum + log.totalCollected, 0)
  );

  readonly rejectPercent = computed(() => {
    const total = this.todaySortedCount();
    if (total === 0) return 0;
    const damaged = this._incomingLogs().reduce((sum, log) => sum + log.damagedCount, 0);
    return Math.round((damaged / total) * 1000) / 10;
  });

  receiveEggs(payload: ReceiveEggPayload): void {
    const total = Number(payload.totalCount) || 0;
    const damaged = Number(payload.damagedCount) || 0;
    const validCount = Math.max(0, total - damaged);

    this._categories.update(cats =>
      cats.map(cat =>
        cat.code === 'С1' ? { ...cat, countInStock: cat.countInStock + validCount } : cat
      )
    );

    this._incomingLogs.update(logs => [
      {
        id: `egg-log-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        shift: 'Текущая',
        houseName: payload.houseName,
        totalCollected: total,
        commercialGrade: validCount,
        damagedCount: damaged
      },
      ...logs
    ]);
  }
}