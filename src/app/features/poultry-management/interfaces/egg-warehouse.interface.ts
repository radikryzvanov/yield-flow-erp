import { Entity } from '../../../core/interfaces/entity.interface';

// Категории столового яйца по ГОСТ
export type EggCategory = 'СВ' | 'СО' | 'С1' | 'С2' | 'С3' | 'Грязь' | 'Бой/Насечка';

// Входящая партия валового яйца
export interface IncomingEggBatch {
  id: string;
  houseName: string;
  rawEggCount: number;
  date: string;
  status: 'pending' | 'sorted';
}

// Остатки на складе готовой продукции
export interface EggStock {
  category: EggCategory;
  description: string;
  count: number;
  unit: string;
}

// Запись о сортировке валовой партии
export interface EggSortingBatch extends Entity {
  date: string;
  sourceHouseId: string;
  totalGrossReceived: number;
  sortedYield: {
    category: EggCategory;
    count: number;
  }[];
  lossesCount: number;
  operatorName: string;
}

// Текущий остаток готовой продукции на складе
export interface EggInventoryStock {
  category: EggCategory;
  inStockCount: number;
  packagedTraysCount: number;
  packagedBoxesCount: number;
}