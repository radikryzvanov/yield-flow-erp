import { Injectable, signal, computed } from '@angular/core';

export interface EggCategoryStock {
  category: 'СВ' | 'С0' | 'С1' | 'С2' | 'С3' | 'Грязь/Насечка' | 'Бой';
  fullName: string;
  weightRange: string;
  totalPieces: number;
  boxed10Pieces: number;  // В боксах по 10 шт
  boxed30Pieces: number;  // В лотках по 30 шт
  inBulkPieces: number;   // Нефасованное яйцо
  reservedPieces: number; // В резерве под сети
}

export interface RetailOrder {
  id: string;
  retailer: string;      // X5, Магнит, КБ, СТМ
  orderDate: string;
  category: string;
  packageType: 'Бокс 10 шт' | 'Лоток 30 шт' | 'Короб 360 шт';
  orderedPieces: number;
  status: 'В сборке' | 'Зарезервировано' | 'Отгружено';
}

@Injectable({
  providedIn: 'root'
})
export class EggWarehouseService {
  private readonly _stock = signal<EggCategoryStock[]>([
    {
      category: 'СВ',
      fullName: 'Столовое Высшая категория',
      weightRange: '≥ 75 г',
      totalPieces: 18500,
      boxed10Pieces: 12000,
      boxed30Pieces: 5000,
      inBulkPieces: 1500,
      reservedPieces: 10000
    },
    {
      category: 'С0',
      fullName: 'Столовое Отборное',
      weightRange: '65 – 74.9 г',
      totalPieces: 145000,
      boxed10Pieces: 95000,
      boxed30Pieces: 35000,
      inBulkPieces: 15000,
      reservedPieces: 85000
    },
    {
      category: 'С1',
      fullName: 'Столовое Первая категория',
      weightRange: '55 – 64.9 г',
      totalPieces: 280000,
      boxed10Pieces: 180000,
      boxed30Pieces: 70000,
      inBulkPieces: 30000,
      reservedPieces: 190000
    },
    {
      category: 'С2',
      fullName: 'Столовое Вторая категория',
      weightRange: '45 – 54.9 г',
      totalPieces: 62000,
      boxed10Pieces: 30000,
      boxed30Pieces: 25000,
      inBulkPieces: 7000,
      reservedPieces: 25000
    },
    {
      category: 'Грязь/Насечка',
      fullName: 'Технический брак (в меланж)',
      weightRange: 'Любой',
      totalPieces: 8400,
      boxed10Pieces: 0,
      boxed30Pieces: 0,
      inBulkPieces: 8400,
      reservedPieces: 8400
    }
  ]);

  private readonly _orders = signal<RetailOrder[]>([
    {
      id: 'ORD-1092',
      retailer: 'АО «Тандер» (Магнит)',
      orderDate: 'Сегодня, 14:00',
      category: 'С1',
      packageType: 'Бокс 10 шт',
      orderedPieces: 120000,
      status: 'Зарезервировано'
    },
    {
      id: 'ORD-1093',
      retailer: 'X5 Group («Пятёрочка»)',
      orderDate: 'Сегодня, 16:30',
      category: 'С0',
      packageType: 'Бокс 10 шт',
      orderedPieces: 65000,
      status: 'В сборке'
    },
    {
      id: 'ORD-1094',
      retailer: 'Красное & Белое',
      orderDate: 'Завтра, 07:00',
      category: 'С1',
      packageType: 'Лоток 30 шт',
      orderedPieces: 45000,
      status: 'Зарезервировано'
    },
    {
      id: 'ORD-1095',
      retailer: 'Меланжевый завод (Цех переработки)',
      orderDate: 'Сегодня, 18:00',
      category: 'Грязь/Насечка',
      packageType: 'Короб 360 шт',
      orderedPieces: 8400,
      status: 'Отгружено'
    }
  ]);

  readonly stock = this._stock.asReadonly();
  readonly orders = this._orders.asReadonly();

  // Всего товарного яйца на складе
  readonly totalStockPieces = computed(() =>
    this._stock().reduce((sum, item) => sum + item.totalPieces, 0)
  );

  // Всего в резерве под контракты
  readonly totalReservedPieces = computed(() =>
    this._stock().reduce((sum, item) => sum + item.reservedPieces, 0)
  );

  // Свободный остаток к реализации
  readonly totalFreePieces = computed(() =>
    this.totalStockPieces() - this.totalReservedPieces()
  );

  // Процент товарности (без брака)
  readonly commercialEggRate = computed(() => {
    const total = this.totalStockPieces();
    if (total === 0) return 0;
    const waste = this._stock().find(s => s.category === 'Грязь/Насечка')?.totalPieces || 0;
    return Math.round(((total - waste) / total) * 1000) / 10;
  });
}