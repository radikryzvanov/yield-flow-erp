import { Injectable, signal, computed } from '@angular/core';
import { EggSortingBatch, EggInventoryStock, EggCategory } from '../interfaces/egg-warehouse.interface';

@Injectable({
  providedIn: 'root'
})
export class EggWarehouseService {
  // История партий сортировки
  private sortingBatchesSignal = signal<EggSortingBatch[]>([
    {
      id: 'batch-001',
      date: '2026-08-17',
      sourceHouseId: 'house-1',
      totalGrossReceived: 15000,
      sortedYield: [
        { category: 'С0', count: 4500 },
        { category: 'С1', count: 8500 },
        { category: 'С2', count: 1700 },
        { category: 'Грязь', count: 180 }
      ],
      lossesCount: 120,
      operatorName: 'Иванова Е. В.'
    }
  ]);

  // Текущие остатки на складе
  private inventoryStockSignal = signal<EggInventoryStock[]>([
    { category: 'СВ', inStockCount: 3600, packagedTraysCount: 120, packagedBoxesCount: 10 },
    { category: 'С0', inStockCount: 36000, packagedTraysCount: 1200, packagedBoxesCount: 100 },
    { category: 'С1', inStockCount: 54000, packagedTraysCount: 1800, packagedBoxesCount: 150 },
    { category: 'С2', inStockCount: 18000, packagedTraysCount: 600, packagedBoxesCount: 50 },
    { category: 'С3', inStockCount: 7200, packagedTraysCount: 240, packagedBoxesCount: 20 },
    { category: 'Грязь', inStockCount: 900, packagedTraysCount: 30, packagedBoxesCount: 2 },
    { category: 'Насечка/Бой', inStockCount: 500, packagedTraysCount: 0, packagedBoxesCount: 0 }
  ]);

  // Публичные сигналы только для чтения
  readonly sortingBatches = this.sortingBatchesSignal.asReadonly();
  readonly inventoryStock = this.inventoryStockSignal.asReadonly();

  // Общее количество яйца на складе всех категорий
  readonly totalEggsInStock = computed(() =>
    this.inventoryStockSignal().reduce((acc, item) => acc + item.inStockCount, 0)
  );

  // Добавление новой партии сортировки и обновление остатков
  addSortingBatch(batch: Omit<EggSortingBatch, 'id'>): void {
    const newBatch: EggSortingBatch = {
      ...batch,
      id: `batch-${Date.now()}`
    };

    this.sortingBatchesSignal.update(batches => [newBatch, ...batches]);

    // Обновляем остатки по категориям
    this.inventoryStockSignal.update(currentStock => {
      return currentStock.map(stockItem => {
        const sortedItem = newBatch.sortedYield.find(y => y.category === stockItem.category);
        if (sortedItem) {
          const updatedCount = stockItem.inStockCount + sortedItem.count;
          return {
            ...stockItem,
            inStockCount: updatedCount,
            packagedTraysCount: Math.floor(updatedCount / 30),
            packagedBoxesCount: Math.floor(updatedCount / 360)
          };
        }
        return stockItem;
      });
    });
  }
}