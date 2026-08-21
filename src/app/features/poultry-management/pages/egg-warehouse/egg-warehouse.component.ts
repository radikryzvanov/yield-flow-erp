import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EggWarehouseService } from '../../services/egg-warehouse.service';
import { EggCategory } from '../../interfaces/egg-warehouse.interface';

@Component({
  selector: 'app-egg-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './egg-warehouse.component.html',
  styleUrl: './egg-warehouse.component.css'
})
export class EggWarehouseComponent {
  protected readonly warehouseService = inject(EggWarehouseService);

  // Сигналы остатков и истории из сервиса
  readonly inventoryStock = this.warehouseService.inventoryStock;
  readonly sortingBatches = this.warehouseService.sortingBatches;
  readonly totalEggs = this.warehouseService.totalEggsInStock;

  // Поля быстрой формы приема партии валового яйца
  sourceHouseId = 'Птичник №1';
  totalGrossReceived = 12000;
  operatorName = 'Смирнова А. К.';

  // Раскладка по категориям при сортировке
  c0Count = 3500;
  c1Count = 6500;
  c2Count = 1500;
  lossesCount = 500;

  submitBatch(): void {
    const sortedYield: { category: EggCategory; count: number }[] = [
      { category: 'С0', count: Number(this.c0Count) || 0 },
      { category: 'С1', count: Number(this.c1Count) || 0 },
      { category: 'С2', count: Number(this.c2Count) || 0 }
    ];

    this.warehouseService.addSortingBatch({
      date: new Date().toISOString().split('T')[0],
      sourceHouseId: this.sourceHouseId,
      totalGrossReceived: Number(this.totalGrossReceived),
      sortedYield,
      lossesCount: Number(this.lossesCount),
      operatorName: this.operatorName
    });
  }
}