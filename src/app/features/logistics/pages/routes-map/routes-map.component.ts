import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogisticsService } from '../../services/logistics.service';
import { ShipmentOrder } from '../../interfaces/logistics.interface';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-routes-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './routes-map.component.html',
  styleUrl: './routes-map.component.css'
})
export class RoutesMapComponent {
  protected readonly logisticsService = inject(LogisticsService);
  private readonly exportService = inject(ExportService);

  readonly shipments = this.logisticsService.shipments;
  readonly fleet = this.logisticsService.fleet;
  readonly shippedTons = this.logisticsService.totalDailyShippedTons;
  readonly activeVehicles = this.logisticsService.activeVehiclesCount;
  readonly onTimeRate = this.logisticsService.onTimeRatePercent;
  readonly mercuryDocs = this.logisticsService.approvedMercuryDocsCount;

  getShipmentStatusBadge(status: string): string {
    switch (status) {
      case 'in_transit': return 'В пути к РЦ';
      case 'loading': return 'На погрузке';
      case 'delivered': return 'Доставлен';
      default: return status;
    }
  }

  exportToExcel(): void {
    const data = this.shipments();
    if (data.length === 0) return;

    const headers = [
      '№ Накладной / Заказа',
      'Грузополучатель (Клиент / РЦ)',
      'Город назначения',
      'Номенклатура продукции',
      'Объем партии',
      'Ед. изм.',
      'Транспортное средство',
      'Водитель-экспедитор',
      't° в кузове (°C)',
      'Статус рейса',
      'ФГИС Меркурий (ВСД)'
    ];

    const rows = data.map((s: ShipmentOrder) => [
      s.id,
      s.clientName,
      s.destinationCity,
      s.productType,
      s.quantityUnits,
      s.unit,
      s.carrierVehicle,
      s.driverName,
      s.tempInsideCelsius,
      this.getShipmentStatusBadge(s.shippingStatus),
      s.mercuryDocStatus === 'approved' ? 'Оформлен (ВСД)' : 'В обработке'
    ]);

    this.exportService.exportToCsv(headers, rows, 'Реестр_отгрузок_и_рейсов_Логистика');
  }
}