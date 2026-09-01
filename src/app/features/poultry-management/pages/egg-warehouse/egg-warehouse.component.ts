import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EggWarehouseService } from '../../services/egg-warehouse.service';

@Component({
  selector: 'app-egg-warehouse',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './egg-warehouse.component.html',
  styleUrl: './egg-warehouse.component.css'
})
export class EggWarehouseComponent {
  protected readonly warehouseService = inject(EggWarehouseService);

  readonly incomingBatches = this.warehouseService.incomingBatches;
  readonly stocks = this.warehouseService.stocks;
  readonly totalStockEggs = this.warehouseService.totalStockEggs;
  readonly totalPendingRawEggs = this.warehouseService.totalPendingRawEggs;

  sortBatch(batchId: string) {
    this.warehouseService.sortBatch(batchId);
  }
}