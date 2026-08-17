import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PoultryHouse } from '../interfaces/poultry-house.interface';
import { PoultryBatch } from '../interfaces/poultry-batch.interface';

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

  // Получить список всех корпусов
  getHouses(): Observable<PoultryHouse[]> {
    return of(this.mockHouses);
  }

  // Получить список всех партий
  getBatches(): Observable<PoultryBatch[]> {
    return of(this.mockBatches);
  }

  // Получить партию, привязанную к конкретному корпусу
  getBatchByHouseId(houseId: string): Observable<PoultryBatch | undefined> {
    const batch = this.mockBatches.find(b => b.houseId === houseId && b.status === 'active');
    return of(batch);
  }
}