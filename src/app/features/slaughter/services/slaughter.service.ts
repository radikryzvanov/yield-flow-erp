import { Injectable, signal, computed } from '@angular/core';
import { SlaughterLine, MeatProductYield, SlaughterBatchLog } from '../interfaces/slaughter.interface';

@Injectable({
  providedIn: 'root'
})
export class SlaughterService {
  private readonly _lines = signal<SlaughterLine[]>([
    {
      id: 'line-1',
      name: 'Автоматическая линия убоя и потрошения (Marel)',
      speedBirdsPerHour: 3800,
      targetSpeed: 4000,
      currentBatch: 'ПАРТИЯ-УБ-204 (Выбраковка несушки К-2, 85 нед.)',
      birdsProcessedToday: 14200,
      targetBirdsToday: 18000,
      averageLiveWeightKg: 1.85,
      meatYieldPercent: 68.4,
      status: 'running'
    },
    {
      id: 'line-2',
      name: 'Участок глубокой разделки и обвалки',
      speedBirdsPerHour: 1200,
      targetSpeed: 1500,
      currentBatch: 'Фасовка суповой птицы и субпродуктов',
      birdsProcessedToday: 8900,
      targetBirdsToday: 12000,
      averageLiveWeightKg: 1.85,
      meatYieldPercent: 68.4,
      status: 'running'
    }
  ]);

  private readonly _products = signal<MeatProductYield[]>([
    {
      id: 'prod-1',
      category: 'Тушка куры несушки 1 сорт (ГОСТ 31962)',
      yieldKg: 9800,
      sharePercent: 54,
      pricePerKgRub: 145,
      destination: 'Охлажденный склад (Сети)'
    },
    {
      id: 'prod-2',
      category: 'Тушка куры 2 сорт (Суповая)',
      yieldKg: 4200,
      sharePercent: 23,
      pricePerKgRub: 110,
      destination: 'Шоковая заморозка'
    },
    {
      id: 'prod-3',
      category: 'Субпродукты пищевые (печень, сердце, мышечный желудок)',
      yieldKg: 1950,
      sharePercent: 11,
      pricePerKgRub: 165,
      destination: 'Фасовка в лотки'
    },
    {
      id: 'prod-4',
      category: 'Сырье для мясокостной муки (перо, кость, отходы)',
      yieldKg: 2180,
      sharePercent: 12,
      pricePerKgRub: 32,
      destination: 'Кормоцех (Утильзавод)'
    }
  ]);

  private readonly _logs = signal<SlaughterBatchLog[]>([
    {
      id: 'SLAUGHT-890',
      date: 'Сегодня, смена № 1',
      sourceHouse: 'Птичник № 2 (Несушка Декалб)',
      birdsCount: 14200,
      totalLiveWeightTons: 26.27,
      totalMeatYieldTons: 17.97,
      firstGradePercent: 78.5,
      vetInspectionStatus: 'passed'
    },
    {
      id: 'SLAUGHT-889',
      date: 'Вчера',
      sourceHouse: 'Птичник № 4 (Родительское стадо)',
      birdsCount: 16500,
      totalLiveWeightTons: 33.00,
      totalMeatYieldTons: 22.77,
      firstGradePercent: 82.0,
      vetInspectionStatus: 'passed'
    }
  ]);

  readonly lines = this._lines.asReadonly();
  readonly products = this._products.asReadonly();
  readonly logs = this._logs.asReadonly();

  readonly totalLiveWeightTodayTons = computed(() => {
    const line = this._lines()[0];
    return Math.round((line.birdsProcessedToday * line.averageLiveWeightKg / 1000) * 100) / 100;
  });

  readonly totalMeatYieldKg = computed(() =>
    this._products().reduce((sum, p) => sum + p.yieldKg, 0)
  );

  readonly totalSlaughterRevenueRub = computed(() =>
    this._products().reduce((sum, p) => sum + (p.yieldKg * p.pricePerKgRub), 0)
  );

  readonly averageYieldPercent = computed(() => 68.4);
}