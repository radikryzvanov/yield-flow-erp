import { Injectable, computed, signal } from '@angular/core';
import { MedicationStock, MortalityLog, VaccineRecord } from '../interfaces/veterinary.interface';

@Injectable({
  providedIn: 'root'
})
export class VeterinaryService {
  // 1. График вакцинаций
  private readonly _vaccinations = signal<VaccineRecord[]>([
    {
      id: 'vac-1',
      batchNumber: 'ПАРТИЯ-РОСС-308-А',
      houseId: 'Корпус № 1 (Бройлеры)',
      birdAgeDays: 1,
      vaccineName: 'Вакцина против болезни Марека (HVT)',
      plannedDate: '2026-08-20',
      completedDate: '2026-08-20',
      status: 'completed',
      method: 'инкубаторий',
      veterinarian: 'Семенов А. В.'
    },
    {
      id: 'vac-2',
      batchNumber: 'ПАРТИЯ-РОСС-308-А',
      houseId: 'Корпус № 1 (Бройлеры)',
      birdAgeDays: 12,
      vaccineName: 'Вакцина против болезни Гамборо (штамм 228E)',
      plannedDate: '2026-08-24',
      status: 'planned',
      method: 'выпойка',
      veterinarian: 'Семенов А. В.'
    },
    {
      id: 'vac-3',
      batchNumber: 'ПАРТИЯ-ХАЙСЕКС-Б',
      houseId: 'Корпус № 3 (Несушки)',
      birdAgeDays: 28,
      vaccineName: 'Вакцина против болезни Ньюкасла (Ла-Сота)',
      plannedDate: '2026-08-25',
      status: 'planned',
      method: 'аэрозоль (спрей)',
      veterinarian: 'Иванова Е. М.'
    }
  ]);

  // 2. Склад ветпрепаратов
  private readonly _medications = signal<MedicationStock[]>([
    {
      id: 'med-1',
      name: 'Вакцина Гамборо 228E (10 000 доз)',
      category: 'вакцина',
      quantity: 5,
      unit: 'фл',
      minThreshold: 8,
      expiryDate: '2027-02-15'
    },
    {
      id: 'med-2',
      name: 'Витаминный комплекс Чиктоник',
      category: 'витаминный комплекс',
      quantity: 45,
      unit: 'л',
      minThreshold: 20,
      expiryDate: '2026-12-01'
    },
    {
      id: 'med-3',
      name: 'Дезинфектант Экоцид С',
      category: 'дезинфектант',
      quantity: 120,
      unit: 'кг',
      minThreshold: 50,
      expiryDate: '2028-05-10'
    },
    {
      id: 'med-4',
      name: 'Энрофлоксацин 10% (раствор)',
      category: 'антибиотик',
      quantity: 4,
      unit: 'л',
      minThreshold: 10,
      expiryDate: '2026-11-20'
    }
  ]);

  // 3. Журнал падежа и осмотра
  private readonly _mortalityLogs = signal<MortalityLog[]>([
    {
      id: 'mort-1',
      date: '2026-08-24',
      houseId: 'Корпус № 1 (Бройлеры)',
      batchNumber: 'ПАРТИЯ-РОСС-308-А',
      count: 12,
      reason: 'Технологический отход (слабые цыплята)',
      vetConfirmed: true
    },
    {
      id: 'mort-2',
      date: '2026-08-24',
      houseId: 'Корпус № 2 (Бройлеры)',
      batchNumber: 'ПАРТИЯ-РОСС-308-Б',
      count: 8,
      reason: 'Асцит (водянка)',
      vetConfirmed: true
    }
  ]);

  // Публичные сигналы (Readonly)
  readonly vaccinations = this._vaccinations.asReadonly();
  readonly medications = this._medications.asReadonly();
  readonly mortalityLogs = this._mortalityLogs.asReadonly();

  // Вычисляемые метрики
  readonly plannedVaccinationsCount = computed(() =>
    this._vaccinations().filter(v => v.status === 'planned').length
  );

  readonly lowStockAlerts = computed(() =>
    this._medications().filter(m => m.quantity <= m.minThreshold)
  );

  readonly totalMortalityToday = computed(() =>
    this._mortalityLogs()
      .filter(m => m.date === '2026-08-24')
      .reduce((sum, item) => sum + item.count, 0)
  );

  // Методы управления
  completeVaccination(id: string): void {
    const today = new Date().toISOString().slice(0, 10);
    this._vaccinations.update(list =>
      list.map(record =>
        record.id === id
          ? { ...record, status: 'completed', completedDate: today }
          : record
      )
    );
  }

  addMortalityRecord(data: Omit<MortalityLog, 'id' | 'vetConfirmed'>): void {
    const newRecord: MortalityLog = {
      ...data,
      id: `mort-${Date.now()}`,
      vetConfirmed: true
    };
    this._mortalityLogs.update(list => [newRecord, ...list]);
  }
}