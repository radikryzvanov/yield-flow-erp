import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PoultryHouse } from '../interfaces/poultry-house.interface';
import { PoultryBatch } from '../interfaces/poultry-batch.interface';
import { PoultryDailyLog } from '../interfaces/poultry-daily-log.interface';

@Injectable({
  providedIn: 'root'
})
export class PoultryManagementService {
  // Моковые данные птичников
  private mockHouses: PoultryHouse[] = [
    { id: '1', name: 'Птичник №1 (Бройлеры)', capacity: 5000, isActive: true },
    { id: '2', name: 'Птичник №2 (Несушки)', capacity: 3500, isActive: true },
    { id: '3', name: 'Птичник №3 (Карантин)', capacity: 1000, isActive: false }
  ];

  // Моковые данные активных партий
  private mockBatches: PoultryBatch[] = [
    {
      id: 'b-101',
      houseId: '1',
      batchNumber: 'ПАРТИЯ-2026-01',
      initialCount: 5000,
      currentCount: 4920,
      placementDate: '2026-07-15',
      status: 'active'
    },
    {
      id: 'b-102',
      houseId: '2',
      batchNumber: 'ПАРТИЯ-2026-02',
      initialCount: 3500,
      currentCount: 3480,
      placementDate: '2026-06-01',
      status: 'active'
    }
  ];

  // Моковые данные суточного журнала
  private mockDailyLogs: PoultryDailyLog[] = [
    {
      id: 'log-1',
      batchId: 'b-101',
      houseId: '1',
      date: '2026-08-16',
      mortalityCount: 5,
      cullingCount: 1,
      eggCount: 0,
      feedConsumedKg: 520,
      notes: 'Температурный режим в норме'
    },
    {
      id: 'log-2',
      batchId: 'b-102',
      houseId: '2',
      date: '2026-08-16',
      mortalityCount: 2,
      cullingCount: 0,
      eggCount: 3100,
      brokenEggCount: 15,
      feedConsumedKg: 410,
      notes: 'Сбор яйца стабильный'
    }
  ];

  getHouses(): Observable<PoultryHouse[]> {
    return of(this.mockHouses);
  }

  getBatches(): Observable<PoultryBatch[]> {
    return of(this.mockBatches);
  }

  getBatchByHouseId(houseId: string): Observable<PoultryBatch | undefined> {
    const batch = this.mockBatches.find(b => b.houseId === houseId && b.status === 'active');
    return of(batch);
  }

  // Получить записи суточного журнала по ID партии
  getDailyLogsByBatchId(batchId: string): Observable<PoultryDailyLog[]> {
    const logs = this.mockDailyLogs.filter(log => log.batchId === batchId);
    return of(logs);
  }

  // Добавить новую суточную запись бригадира с авто-списанием поголовья
  addDailyLog(newLogData: Omit<PoultryDailyLog, 'id'>): Observable<PoultryDailyLog> {
    const newLog: PoultryDailyLog = {
      ...newLogData,
      id: `log-${Date.now()}`
    };

    this.mockDailyLogs.push(newLog);

    // Автоматически уменьшаем текущее поголовье партии на падёж и выбраковку
    const targetBatch = this.mockBatches.find(b => b.id === newLog.batchId);
    if (targetBatch) {
      targetBatch.currentCount -= (newLog.mortalityCount + (newLog.cullingCount || 0));
    }

    return of(newLog);
  }
}