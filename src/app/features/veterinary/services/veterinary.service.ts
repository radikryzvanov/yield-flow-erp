import { Injectable, computed, inject } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';
import { VaccineScheduleItem, DrugStockItem, HealthCheckLog } from '../interfaces/veterinary.interface';
import { PoultryManagementService } from '../../poultry-management/services/poultry-management.service';

@Injectable({
  providedIn: 'root'
})
export class VeterinaryService {
  private readonly poultryService = inject(PoultryManagementService);

  private readonly _schedule = persistedSignal<VaccineScheduleItem[]>('yieldflow_vet_schedule', [
    {
      id: 'vac-1',
      targetHouse: 'Птичник № 3 (Молодняк)',
      disease: 'Болезнь Гамборо (ИББ)',
      vaccineName: 'Гамборомикс D78',
      ageDays: 14,
      method: 'water',
      dosageDoses: 40000,
      status: 'urgent',
      drugStockId: 'st-2'
    },
    {
      id: 'vac-2',
      targetHouse: 'Инкубаторий (Petersime)',
      disease: 'Болезнь Марека + ИБК',
      vaccineName: 'Нобилис Rismavac + CA',
      ageDays: 1,
      method: 'in-ovo',
      dosageDoses: 55000,
      status: 'pending',
      drugStockId: 'st-1'
    },
    {
      id: 'vac-3',
      targetHouse: 'Птичник № 1 (Несушка)',
      disease: 'Ньюкаслская болезнь (НБ)',
      vaccineName: 'Ньюкасл Клон Ла-Сота',
      ageDays: 110,
      method: 'spray',
      dosageDoses: 52000,
      status: 'urgent',
      drugStockId: 'st-3'
    },
    {
      id: 'vac-4',
      targetHouse: 'Птичник № 2 (Несушка)',
      disease: 'Синдром снижения яйценоскости (ССЯ-76)',
      vaccineName: 'ЭДС-Вак инактивированная',
      ageDays: 125,
      method: 'injection',
      dosageDoses: 45000,
      status: 'pending',
      drugStockId: 'st-4'
    }
  ]);

  private readonly _stock = persistedSignal<DrugStockItem[]>('yieldflow_vet_stock', [
    {
      id: 'st-1',
      name: 'Вакцина против болезни Марека (Rismavac)',
      stockDoses: 120000,
      unit: 'доз',
      batchNumber: 'V-2026-04',
      expiryDate: '12.2026',
      category: 'vaccine',
      status: 'sufficient'
    },
    {
      id: 'st-2',
      name: 'Гамборомикс D78 (ИББ живая)',
      stockDoses: 85000,
      unit: 'доз',
      batchNumber: 'V-2026-08',
      expiryDate: '10.2026',
      category: 'vaccine',
      status: 'sufficient'
    },
    {
      id: 'st-3',
      name: 'Ньюкасл Клон Ла-Сота (Живая лиофилизированная)',
      stockDoses: 110000,
      unit: 'доз',
      batchNumber: 'V-2026-11',
      expiryDate: '03.2027',
      category: 'vaccine',
      status: 'sufficient'
    },
    {
      id: 'st-4',
      name: 'ЭДС-Вак (Инактивированная эмульсия)',
      stockDoses: 95000,
      unit: 'доз',
      batchNumber: 'V-2026-09',
      expiryDate: '01.2027',
      category: 'vaccine',
      status: 'sufficient'
    },
    {
      id: 'st-5',
      name: 'Энрофлоксацин 10% (Антибактериальный р-р)',
      stockDoses: 45,
      unit: 'литров',
      batchNumber: 'AB-884',
      expiryDate: '06.2027',
      category: 'antibiotic',
      status: 'sufficient'
    },
    {
      id: 'st-6',
      name: 'Витаминный комплекс Чиктоник',
      stockDoses: 120,
      unit: 'литров',
      batchNumber: 'VIT-91',
      expiryDate: '08.2027',
      category: 'vitamin',
      status: 'sufficient'
    }
  ]);

  private readonly _logs = persistedSignal<HealthCheckLog[]>('yieldflow_vet_logs', [
    {
      id: 'log-1',
      date: 'Сегодня, 08:30',
      house: 'Птичник № 1 (Несушка Ломанн)',
      flockAgeWeeks: 34,
      mortalityCount: 6,
      mortalityRatePercent: 0.01,
      clinicalSigns: 'Птица активна, потребление воды в норме, помет сформирован.',
      vetDoctor: 'Иванов С. М.',
      quarantineStatus: 'normal'
    },
    {
      id: 'log-2',
      date: 'Сегодня, 09:15',
      house: 'Птичник № 2 (Несушка Декалб)',
      flockAgeWeeks: 42,
      mortalityCount: 8,
      mortalityRatePercent: 0.02,
      clinicalSigns: 'Норма. Оперение чистое, признаков респираторных хрипов нет.',
      vetDoctor: 'Иванов С. М.',
      quarantineStatus: 'normal'
    },
    {
      id: 'log-3',
      date: 'Вчера, 15:40',
      house: 'Птичник № 3 (Молодняк)',
      flockAgeWeeks: 12,
      mortalityCount: 4,
      mortalityRatePercent: 0.01,
      clinicalSigns: 'Плановый осмотр перед дегельминтизацией. Состояние удовлетворительное.',
      vetDoctor: 'Смирнова Е. В.',
      quarantineStatus: 'normal'
    }
  ]);

  readonly schedule = this._schedule.asReadonly();
  readonly stock = this._stock.asReadonly();
  readonly logs = this._logs.asReadonly();

  readonly pendingVaccinationsCount = computed(() =>
    this._schedule().filter(s => s.status === 'urgent' || s.status === 'pending').length
  );

  readonly totalDailyMortality = computed(() =>
    this._logs()
      .filter(l => l.date.includes('Сегодня'))
      .reduce((sum, l) => sum + l.mortalityCount, 0)
  );

  // Динамический расчёт общей сохранности стада по птичникам
  readonly flockLivabilityPercent = computed(() => {
    const houses = this.poultryService.houses();
    if (houses.length === 0) return 100;
    const totalInitial = houses.reduce((sum, h) => sum + h.initialBirdCount, 0);
    const totalCurrent = houses.reduce((sum, h) => sum + h.birdCount, 0);
    if (totalInitial === 0) return 100;
    return Math.round((totalCurrent / totalInitial) * 1000) / 10;
  });

  completeVaccination(scheduleId: string): boolean {
    const item = this._schedule().find(s => s.id === scheduleId);
    if (!item || item.status === 'completed') return false;

    let drugDeducted = false;

    if (item.drugStockId) {
      const targetDrug = this._stock().find(d => d.id === item.drugStockId);
      if (targetDrug && targetDrug.stockDoses >= item.dosageDoses) {
        this._stock.update(stock =>
          stock.map(drug =>
            drug.id === item.drugStockId
              ? { ...drug, stockDoses: drug.stockDoses - item.dosageDoses }
              : drug
          )
        );
        drugDeducted = true;
      }
    } else {
      const fallbackDrug = this._stock().find(d =>
        d.name.toLowerCase().includes(item.vaccineName.slice(0, 7).toLowerCase())
      );
      if (fallbackDrug && fallbackDrug.stockDoses >= item.dosageDoses) {
        this._stock.update(stock =>
          stock.map(drug =>
            drug.id === fallbackDrug.id
              ? { ...drug, stockDoses: drug.stockDoses - item.dosageDoses }
              : drug
          )
        );
        drugDeducted = true;
      }
    }

    if (!drugDeducted) {
      return false;
    }

    this._schedule.update(schedule =>
      schedule.map(s => (s.id === scheduleId ? { ...s, status: 'completed' } : s))
    );

    return true;
  }

  replenishDrugStock(drugId: string, amount: number): boolean {
    const count = Number(amount);
    if (!count || count <= 0) return false;

    let updated = false;
    this._stock.update(stock =>
      stock.map(d => {
        if (d.id === drugId) {
          updated = true;
          return { ...d, stockDoses: d.stockDoses + count };
        }
        return d;
      })
    );

    return updated;
  }

  addHealthCheckLog(log: Omit<HealthCheckLog, 'id' | 'date'>): void {
    const timeFormatted = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date());

    const newEntry: HealthCheckLog = {
      ...log,
      id: `log-${Date.now().toString().slice(-4)}`,
      date: `Сегодня, ${timeFormatted}`
    };

    this._logs.update(logs => [newEntry, ...logs]);
  }
}