import { Injectable, signal, computed } from '@angular/core';
import { IncomingEggBatch, EggStock } from '../interfaces/egg-warehouse.interface';

@Injectable({
  providedIn: 'root'
})
export class EggWarehouseService {
  // Входящие партии валового яйца из птичников
  private readonly _incomingBatches = signal<IncomingEggBatch[]>([
    {
      id: 'batch-101',
      houseName: 'Птичник № 1 (Промышленная несушка)',
      rawEggCount: 50199,
      date: 'Сегодня, 08:30',
      status: 'pending'
    },
    {
      id: 'batch-102',
      houseName: 'Птичник № 2 (Промышленная несушка)',
      rawEggCount: 41035,
      date: 'Сегодня, 09:15',
      status: 'pending'
    }
  ]);

  // Остатки рассортированного яйца на складе готовой продукции
  private readonly _stocks = signal<EggStock[]>([
    { category: 'СВ', description: 'Высшая категория (>75г)', count: 18400, unit: 'шт' },
    { category: 'СО', description: 'Отборное яйцо (65-74.9г)', count: 142000, unit: 'шт' },
    { category: 'С1', description: 'Первая категория (55-64.9г)', count: 215000, unit: 'шт' },
    { category: 'С2', description: 'Вторая категория (45-54.9г)', count: 48000, unit: 'шт' },
    { category: 'Бой/Насечка', description: 'Технический брак / меланж', count: 6200, unit: 'шт' }
  ]);

  readonly incomingBatches = this._incomingBatches.asReadonly();
  readonly stocks = this._stocks.asReadonly();

  // Всего рассортированного товарного яйца
  readonly totalStockEggs = computed(() =>
    this._stocks().reduce((sum, s) => sum + s.count, 0)
  );

  // Объем яйца, ожидающего сортировки
  readonly totalPendingRawEggs = computed(() =>
    this._incomingBatches()
      .filter(b => b.status === 'pending')
      .reduce((sum, b) => sum + b.rawEggCount, 0)
  );

  // Регистрация поступления валового яйца из птичника
  registerIncomingEggs(houseName: string, eggCount: number) {
    if (eggCount <= 0) return;

    const newBatch: IncomingEggBatch = {
      id: 'batch-' + Date.now(),
      houseName: houseName,
      rawEggCount: eggCount,
      date: 'Только что',
      status: 'pending'
    };

    this._incomingBatches.update(batches => [newBatch, ...batches]);
  }

  // Сортировка партии на яйцесортировочной машине
  sortBatch(batchId: string) {
    const batch = this._incomingBatches().find(b => b.id === batchId);
    if (!batch || batch.status === 'sorted') return;

    const count = batch.rawEggCount;

    // Стандартное промышленное распределение партий кросса
    const sv = Math.round(count * 0.05);   // 5% Высшая
    const s0 = Math.round(count * 0.35);   // 35% Отборное
    const s1 = Math.round(count * 0.45);   // 45% Первая категория
    const s2 = Math.round(count * 0.11);   // 11% Вторая категория
    const reject = count - (sv + s0 + s1 + s2); // 4% Бой/Насечка

    // Пополняем остатки склада
    this._stocks.update(stocks =>
      stocks.map(s => {
        if (s.category === 'СВ') return { ...s, count: s.count + sv };
        if (s.category === 'СО') return { ...s, count: s.count + s0 };
        if (s.category === 'С1') return { ...s, count: s.count + s1 };
        if (s.category === 'С2') return { ...s, count: s.count + s2 };
        if (s.category === 'Бой/Насечка') return { ...s, count: s.count + reject };
        return s;
      })
    );

    // Помечаем партию как рассортированную
    this._incomingBatches.update(batches =>
      batches.map(b => (b.id === batchId ? { ...b, status: 'sorted' } : b))
    );
  }
}