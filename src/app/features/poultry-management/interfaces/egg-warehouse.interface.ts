import { Entity } from '../../../core/interfaces/entity.interface';

// Категории столового яйца по ГОСТ
export type EggCategory = 'СВ' | 'С0' | 'С1' | 'С2' | 'С3' | 'Грязь' | 'Насечка/Бой';

// Запись о сортировке валовой партии
export interface EggSortingBatch extends Entity {
  date: string;              // Дата сортировки (YYYY-MM-DD)
  sourceHouseId: string;     // Откуда поступило валовое яйцо (ID птичника)
  totalGrossReceived: number; // Общее количество поступившего валового яйца (шт.)
  sortedYield: {
    category: EggCategory;
    count: number;           // Количество яиц этой категории (шт.)
  }[];
  lossesCount: number;       // Бой / некондиция (шт.)
  operatorName: string;      // ФИО учетчика / оператора сортировочной машины
}

// Текущий остаток готовой продукции на складе
export interface EggInventoryStock {
  category: EggCategory;
  inStockCount: number;      // Количество на остатке (шт.)
  packagedTraysCount: number;// Количество упакованных лотков (по 30 шт.)
  packagedBoxesCount: number;// Количество коробок (по 360 шт.)
}