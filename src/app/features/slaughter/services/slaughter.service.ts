import { Injectable, computed, signal } from '@angular/core';
import { SlaughterBatch, SlaughterReport, SlaughterYield } from '../interfaces/slaughter.interface';

@Injectable({
  providedIn: 'root'
})
export class SlaughterService {
  // 1. Очередь партий на убой из птичников
  private readonly _pendingBatches = signal<SlaughterBatch[]>([
    {
      id: 'sl-batch-101',
      batchNumber: 'ПАРТИЯ-РОСС-308-А',
      houseId: 'Корпус № 1 (Бройлеры)',
      headsCount: 15000,
      liveWeightKg: 37500,
      avgWeightKg: 2.5,
      arrivalDate: '2026-08-24'
    },
    {
      id: 'sl-batch-102',
      batchNumber: 'ПАРТИЯ-РОСС-308-Б',
      houseId: 'Корпус № 2 (Бройлеры)',
      headsCount: 12000,
      liveWeightKg: 28800,
      avgWeightKg: 2.4,
      arrivalDate: '2026-08-25'
    }
  ]);

  // 2. Журнал завершенных актов убоя
  private readonly _reports = signal<SlaughterReport[]>([
    {
      id: 'rep-20260823-1',
      date: '2026-08-23',
      batchNumber: 'ПАРТИЯ-КОББ-500-В',
      houseId: 'Корпус № 4 (Бройлеры)',
      initialLiveWeightKg: 30000,
      initialHeads: 12000,
      yield: {
        grade1Kg: 19500,
        grade2Kg: 2100,
        byProductsKg: 1800,
        wasteKg: 6300,
        condemnedKg: 300
      },
      meatYieldPercentage: 72.0,
      status: 'completed'
    }
  ]);

  // Readonly сигналы для компонентов
  readonly pendingBatches = this._pendingBatches.asReadonly();
  readonly reports = this._reports.asReadonly();

  // Вычисляемые KPI показатели
  readonly totalMeatProcessedKg = computed(() =>
    this._reports().reduce(
      (sum, rep) => sum + rep.yield.grade1Kg + rep.yield.grade2Kg,
      0
    )
  );

  readonly avgYieldPercentage = computed(() => {
    const list = this._reports();
    if (list.length === 0) return 0;
    const sumPercent = list.reduce((sum, rep) => sum + rep.meatYieldPercentage, 0);
    return +(sumPercent / list.length).toFixed(1);
  });

  readonly totalCondemnedKg = computed(() =>
    this._reports().reduce((sum, rep) => sum + rep.yield.condemnedKg, 0)
  );

  // Проведение акта убоя
  processSlaughter(batchId: string, yieldData: SlaughterYield): void {
    const batch = this._pendingBatches().find(b => b.id === batchId);
    if (!batch) return;

    const totalMeatKg = yieldData.grade1Kg + yieldData.grade2Kg;
    const meatYieldPercentage = +( (totalMeatKg / batch.liveWeightKg) * 100 ).toFixed(1);

    const newReport: SlaughterReport = {
      id: `rep-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      batchNumber: batch.batchNumber,
      houseId: batch.houseId,
      initialLiveWeightKg: batch.liveWeightKg,
      initialHeads: batch.headsCount,
      yield: yieldData,
      meatYieldPercentage,
      status: 'completed'
    };

    // Добавляем отчет и удаляем партию из очереди на убой
    this._reports.update(list => [newReport, ...list]);
    this._pendingBatches.update(list => list.filter(b => b.id !== batchId));
  }
}