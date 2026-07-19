import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PoultryHouse } from '../interfaces/poultry-house.interface';

@Injectable({
  providedIn: 'root'
})
export class PoultryManagementService {
  getHouses(): Observable<PoultryHouse[]> {
    // Возвращаем тестовые данные с задержкой, имитируя реальный HTTP-запрос
    return of([
      { id: '1', name: 'Птичник №1 (Бройлеры)', capacity: 5000, isActive: true },
      { id: '2', name: 'Птичник №2 (Несушки)', capacity: 3500, isActive: true },
      { id: '3', name: 'Птичник №3 (Карантин)', capacity: 1000, isActive: false }
    ]);
  }
}