import { Injectable, computed } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';
import { VaccineScheduleItem, DrugStockItem, HealthCheckLog } from '../interfaces/veterinary.interface';

@Injectable({
  providedIn: 'root'
})
export class VeterinaryService {
  // План-график вакцинаций и обработок
  private readonly _schedule = persistedSignal<VaccineScheduleItem[]>('yieldflow_vet_schedule', [
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

  // Склад ветеринарной аптеки и биопрепаратов
  private readonly _stock = persistedSignal<DrugStockItem[]>('yieldflow_vet_stock', [
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

  // Журнал ежедневного клинического осмотра и эпизоотического статуса
  private readonly _logs = persistedSignal<HealthCheckLog[]>('yieldflow_vet_logs', [
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

  // Выполнение вакцинации и списание доз из аптеки
  completeVaccination(scheduleId: string): boolean {
    const item = this._schedule().find(s => s.id === scheduleId);
    if (!item || item.status === 'completed') return false;

    // 1. Помечаем вакцинацию как выполненную
    this._schedule.update(list =>
      list.map(s => (s.id === scheduleId ? { ...s, status: 'completed' } : s))
    );

    // 2. Списываем дозы соответствующего препарата из аптеки
    this._stock.update(stocks =>
      stocks.map(drug => {
        const matchesName = drug.name.toLowerCase().includes(item.vaccineName.slice(0, 7).toLowerCase());
        if (matchesName && drug.stockDoses > 0) {
          const newDoses = Math.max(0, drug.stockDoses - item.dosageDoses);
          return {
            ...drug,
            stockDoses: newDoses,
            status: newDoses < 15000 ? 'low' : drug.status
          };
        }
        return drug;
      })
    );

    return true;
  }

  // Добавление записи клинического осмотра
  addHealthCheckLog(log: Omit<HealthCheckLog, 'id' | 'date'>): void {
    const now = new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date());

    const newEntry: HealthCheckLog = {
      ...log,
      id: `VET-LOG-${Date.now().toString().slice(-4)}`,
      date: now
    };

    this._logs.update(logs => [newEntry, ...logs]);
  }

  // Пополнение запаса препарата в аптеке
  replenishDrugStock(drugId: string, amount: number): boolean {
    const doses = Number(amount);
    if (isNaN(doses) || doses <= 0) return false;

    let updated = false;

    this._stock.update(stocks =>
      stocks.map(drug => {
        if (drug.id === drugId) {
          updated = true;
          const newTotal = drug.stockDoses + doses;
          return {
            ...drug,
            stockDoses: newTotal,
            status: newTotal > 20000 ? 'ok' : drug.status
          };
        }
        return drug;
      })
    );

    return updated;
  }
}