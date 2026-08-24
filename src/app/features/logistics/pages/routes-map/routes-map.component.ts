import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogisticsService } from '../../services/logistics.service';

@Component({
  selector: 'app-routes-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './routes-map.component.html',
  styleUrl: './routes-map.component.css'
})
export class RoutesMapComponent {
  protected readonly logisticsService = inject(LogisticsService);

  readonly orders = this.logisticsService.orders;
  readonly vehicles = this.logisticsService.vehicles;
  readonly availableVehicles = this.logisticsService.availableVehicles;

  readonly totalWeightInTransitKg = this.logisticsService.totalWeightInTransitKg;
  readonly activeOrdersCount = this.logisticsService.activeOrdersCount;

  // Выбранное авто для отправки заказа
  selectedVehicleId = '';

  dispatch(orderId: string): void {
    if (!this.selectedVehicleId) return;
    this.logisticsService.dispatchOrder(orderId, this.selectedVehicleId);
    this.selectedVehicleId = '';
  }

  completeDelivery(orderId: string): void {
    this.logisticsService.markDelivered(orderId);
  }
}