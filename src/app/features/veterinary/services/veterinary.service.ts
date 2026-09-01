import { Injectable, signal, computed } from '@angular/core';
import { VaccineScheduleItem, DrugStockItem, HealthCheckLog } from '../interfaces/veterinary.interface';

@Injectable({
  providedIn: 'root'
})
export class VeterinaryService {
  private readonly _schedule = signal<VaccineScheduleItem[]>([
    {
      id: 'vac-101',
      ageDays: 1,
      targetHouse: 'Инкубаторий (Выводной № 1)',
      disease: 'Болезнь Марека + ИБК',
      vaccineName: 'Марек Вакс HVT + Инфекционный бронхит',
      method: 'spray',
      plannedDate: '01.09.2026',
      status: 'completed',
      dosageDoses: 54000
    },
    {
      id: 'vac-102',
      ageDays: 14,
      targetHouse: 'Птичник № 3 (Молодняк)',
      disease: 'Болезнь Гамборо (ИББ)',
      vaccineName: 'Гамборо Вак GM-97',
      method: 'water',
      plannedDate: '02.09.2026',
      status: 'urgent',
      dosageDoses: 60000
    },
    {
      id: 'vac-103',
      ageDays: 35,
      targetHouse: 'Птичник № 3 (Молодняк)',
      disease: 'Болезнь Ньюкасла (НБ)',
      vaccineName: 'Ньюкасл Клон Ла-Сота',
      method: 'spray',
      plannedDate: '06.09.2026',
      status: 'pending',
      dosageDoses: 60000
    },
    {
      id: 'vac-104',
      ageDays: 110,
      targetHouse: 'Птичник № 2 (Несушка Декалб)',
      disease: 'Синдром снижения яйценоскости (ССЯ-76)',
      vaccineName: 'ЭДС-Вак инактивированная',
      method: 'injection',
      plannedDate: '12.09.2026',
      status: 'pending',
      dosageDoses: 62000
    }
  ]);

  private readonly _stock = signal<DrugStockItem[]>([
    {
      id: 'st-1',
      name: 'Марек Вакс HVT + Rispens',
      category: 'Вакцины',
      batchNumber: 'SER-8842',
      stockDoses: 120000,
      unit: 'доз',
      expiryDate: '11.2027',
      status: 'ok'
    },
    {
      id: 'st-2',
      name: 'Гамборо Вак GM-97',
      category: 'Вакцины',
      batchNumber: 'SER-9102',
      stockDoses: 65000,
      unit: 'доз',
      expiryDate: '04.2027',
      status: 'low'
    },
    {
      id: 'st-3',
      name: 'Чиктоник (Комплекс аминокислот и витаминов)',
      category: 'Витамины/Электролиты',
      batchNumber: 'VIT-3301',
      stockDoses: 450,
      unit: 'литров',
      expiryDate: '08.2027',
      status: 'ok'
    },
    {
      id: 'st-4',
      name: 'Вироцид (Пенный дезинфектант)',
      category: 'Дезинфектанты',
      batchNumber: 'DES-4411',
      stockDoses: 800,
      unit: 'литров',
      expiryDate: '01.2028',
      status: 'ok'
    }
  ]);

  private readonly _logs = signal<HealthCheckLog[]>([
    {
      id: 'VET-LOG-501',
      date: '01.09.2026',
      house: 'Птичник № 1 (Несушка Ломанн)',
      flockAgeWeeks: 34,
      mortalityCount: 6,
      mortalityRatePercent: 0.01,
      clinicalSigns: 'Клиническое состояние стада отличное. Аппетит и поение в норме.',
      vetDoctor: 'Иванов С. М.',
      quarantineStatus: 'normal'
    },
    {
      id: 'VET-LOG-502',
      date: '01.09.2026',
      house: 'Птичник № 2 (Несушка Декалб)',
      flockAgeWeeks: 28,
      mortalityCount: 14,
      mortalityRatePercent: 0.02,
      clinicalSigns: 'Локальный тепловой стресс в секции В. Усилена вентиляция, назначена выпойка витамина C.',
      vetDoctor: 'Иванов С. М.',
      quarantineStatus: 'observation'
    }
  ]);

  readonly schedule = this._schedule.asReadonly();
  readonly stock = this._stock.asReadonly();
  readonly logs = this._logs.asReadonly();

  readonly pendingVaccinationsCount = computed(() =>
    this._schedule().filter(s => s.status !== 'completed').length
  );

  readonly totalDailyMortality = computed(() =>
    this._logs().reduce((sum, l) => sum + l.mortalityCount, 0)
  );

  readonly flockLivabilityPercent = computed(() => 98.6);
}