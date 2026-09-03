import { Injectable, computed } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';
import { SlaughterLine, MeatProductYield, SlaughterBatchLog } from '../interfaces/slaughter.interface';

export interface IncomingFlockDelivery {
  id: string;
  sourceHouse: string;
  birdsCount: number;
  averageWeightKg: number;
  deliveryTime: string;
  status: 'docked' | 'processing' | 'processed';
}

@Injectable({
  providedIn: 'root'
})
export class SlaughterService {
  // Партии птицы, поступившие из птичников в зону навески
  private readonly _deliveries = persistedSignal<IncomingFlockDelivery[]>('yieldflow_slaughter_deliveries', [
    {
      id: 'DELIV-301',
      sourceHouse: 'Птичник № 2 (Выбраковка несушки)',
      birdsCount: 15400,
      averageWeightKg: 1.86,
      deliveryTime: 'Сегодня, 06:45 (Автовесовая № 1)',
      status: 'docked'
    },
    {
      id: 'DELIV-300',
      sourceHouse: 'Птичник № 4 (Родительское стадо)',
      birdsCount: 16500,
      averageWeightKg: 2.00,
      deliveryTime: 'Вчера, 14:20',
      status: 'processed'
    }
  ]);

  // Технологические линии убоя
  private readonly _lines = persistedSignal<SlaughterLine[]>('yieldflow_slaughter_lines', [
    {
      id: 'line-1',
      name: 'Автоматическая линия убоя и потрошения (Marel)',
      speedBirdsPerHour: 3800,
      targetSpeed: 4000,
      currentBatch: 'Ожидает запуска навески',
      birdsProcessedToday: 14200,
      targetBirdsToday: 18000,
      averageLiveWeightKg: 1.85,
      meatYieldPercent: 68.4,
      status: 'paused'
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

  // Склад мясной продукции
  private readonly _products = persistedSignal<MeatProductYield[]>('yieldflow_slaughter_products', [
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

  // Журнал партий убоя
  private readonly _logs = persistedSignal<SlaughterBatchLog[]>('yieldflow_slaughter_logs', [
    {
      id: 'SLAUGHT-890',
      date: 'Сегодня, смена № 1',
      sourceHouse: 'Птичник № 1 (Несушка Ломанн)',
      birdsCount: 14200,
      totalLiveWeightTons: 26.27,
      totalMeatYieldTons: 17.97,
      firstGradePercent: 78.5,
      vetInspectionStatus: 'passed'
    }
  ]);

  readonly deliveries = this._deliveries.asReadonly();
  readonly lines = this._lines.asReadonly();
  readonly products = this._products.asReadonly();
  readonly logs = this._logs.asReadonly();

  // Активная партия в зоне разгрузки/навески
  readonly pendingDelivery = computed(() =>
    this._deliveries().find(d => d.status === 'docked') || null
  );

  readonly totalMeatYieldKg = computed(() =>
    this._products().reduce((sum, p) => sum + p.yieldKg, 0)
  );

  readonly totalSlaughterRevenueRub = computed(() =>
    this._products().reduce((sum, p) => sum + (p.yieldKg * p.pricePerKgRub), 0)
  );

  // Пуск конвейера по входящей партии
  startBatchProcessing(deliveryId: string): void {
    const delivery = this._deliveries().find(d => d.id === deliveryId);
    if (!delivery || delivery.status !== 'docked') return;

    const liveWeightKg = delivery.birdsCount * delivery.averageWeightKg;
    const liveWeightTons = Math.round((liveWeightKg / 1000) * 100) / 100;
    const meatYieldKg = Math.round(liveWeightKg * 0.684);
    const meatYieldTons = Math.round((meatYieldKg / 1000) * 100) / 100;

    const grade1 = Math.round(meatYieldKg * 0.54);
    const grade2 = Math.round(meatYieldKg * 0.23);
    const offal = Math.round(meatYieldKg * 0.11);
    const mealRaw = meatYieldKg - (grade1 + grade2 + offal);

    // 1. Пополнение остатков готовой продукции
    this._products.update(products =>
      products.map(p => {
        if (p.id === 'prod-1') return { ...p, yieldKg: p.yieldKg + grade1 };
        if (p.id === 'prod-2') return { ...p, yieldKg: p.yieldKg + grade2 };
        if (p.id === 'prod-3') return { ...p, yieldKg: p.yieldKg + offal };
        if (p.id === 'prod-4') return { ...p, yieldKg: p.yieldKg + mealRaw };
        return p;
      })
    );

    // 2. Обновление статуса главной линии
    this._lines.update(lines =>
      lines.map((l, idx) => {
        if (idx === 0) {
          return {
            ...l,
            status: 'running',
            currentBatch: `${delivery.sourceHouse} (${delivery.birdsCount} гол.)`,
            birdsProcessedToday: l.birdsProcessedToday + delivery.birdsCount
          };
        }
        return l;
      })
    );

    // 3. Фиксация в производственном журнале
    const timeFormatted = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());

    const newLog: SlaughterBatchLog = {
      id: `SLAUGHT-${Date.now().toString().slice(-4)}`,
      date: `Сегодня, ${timeFormatted}`,
      sourceHouse: delivery.sourceHouse,
      birdsCount: delivery.birdsCount,
      totalLiveWeightTons: liveWeightTons,
      totalMeatYieldTons: meatYieldTons,
      firstGradePercent: 81.4,
      vetInspectionStatus: 'passed'
    };

    this._logs.update(logs => [newLog, ...logs]);

    // 4. Закрытие партии
    this._deliveries.update(list =>
      list.map(d => (d.id === deliveryId ? { ...d, status: 'processed' } : d))
    );
  }

  // Переключение режима линии (мойка/пауза/работа)
  toggleLineStatus(lineId: string, status: 'running' | 'paused' | 'sanitization'): void {
    this._lines.update(lines =>
      lines.map(l => (l.id === lineId ? { ...l, status } : l))
    );
  }
}