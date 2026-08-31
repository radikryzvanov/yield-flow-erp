import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogisticsService } from '../../services/logistics.service';

@Component({
  selector: 'app-routes-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './routes-map.component.html',
  styleUrl: './routes-map.component.css'
})
export class RoutesMapComponent {
  protected readonly logisticsService = inject(LogisticsService);

  readonly shipments = this.logisticsService.shipments;
  readonly fleet = this.logisticsService.fleet;
  readonly shippedTons = this.logisticsService.totalDailyShippedTons;
  readonly activeVehicles = this.logisticsService.activeVehiclesCount;
  readonly onTimeRate = this.logisticsService.onTimeRatePercent;
  readonly mercuryDocs = this.logisticsService.approvedMercuryDocsCount;

  getShipmentStatusBadge(status: string): string {
    switch (status) {
      case 'in_transit': return '🚛 В пути к РЦ';
      case 'loading': return '📦 На погрузке';
      case 'delivered': return '✅ Доставлен';
      default: return status;
    }
  }
}