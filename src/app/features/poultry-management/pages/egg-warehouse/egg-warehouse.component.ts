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

  readonly stock = this.warehouseService.stock;
  readonly orders = this.warehouseService.orders;
  readonly totalStockPieces = this.warehouseService.totalStockPieces;
  readonly totalReservedPieces = this.warehouseService.totalReservedPieces;
  readonly totalFreePieces = this.warehouseService.totalFreePieces;
  readonly commercialEggRate = this.warehouseService.commercialEggRate;
}