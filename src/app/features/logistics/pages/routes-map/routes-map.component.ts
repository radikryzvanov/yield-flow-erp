import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogisticsService } from '../../services/logistics.service';
import { ShipmentOrder } from '../../interfaces/logistics.interface';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-routes-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Модальное окно создания отгрузки
  readonly isCreateModalOpen = signal<boolean>(false);

  newClientName: string = 'X5 Retail Group (РЦ Подольск)';
  newDestinationCity: string = 'Москва и МО';
  newProductType: string = 'Яйцо куриное столовое С1 (Брендированное)';
  newQuantityUnits: number = 720;
  newUnit: string = 'кор. (259 200 шт)';
  newCarrierVehicle: string = 'Scania Р440АК 73';
  newDriverName: string = 'Сергеев В. А.';
  newTempInside: number = 4.0;
  newDepartureTime: string = 'Погрузка: Рампа № 1';
  newStatus: ShipmentOrder['shippingStatus'] = 'loading';

  openCreateModal(): void {
    const defaultCar = this.fleet()[0];
    if (defaultCar) {
      this.newCarrierVehicle = `${defaultCar.model} ${defaultCar.plateNumber}`;
    }
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreateShipment(): void {
    if (!this.newClientName.trim() || !this.newQuantityUnits || this.newQuantityUnits <= 0) {
      alert('Заполните наименование клиента и объем отгрузки.');
      return;
    }

    this.logisticsService.createShipment({
      clientName: this.newClientName.trim(),
      destinationCity: this.newDestinationCity.trim(),
      productType: this.newProductType.trim(),
      quantityUnits: Number(this.newQuantityUnits),
      unit: this.newUnit,
      carrierVehicle: this.newCarrierVehicle,
      driverName: this.newDriverName.trim(),
      tempInsideCelsius: Number(this.newTempInside) || 4.0,
      departureTime: this.newDepartureTime.trim(),
      shippingStatus: this.newStatus
    });

    this.closeCreateModal();
  }

  onStatusChange(shipmentId: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as ShipmentOrder['shippingStatus'];
    let onTime: boolean | undefined = undefined;

    if (newStatus === 'delivered') {
      onTime = confirm('Заказ доставлен вовремя (в рамках тайм-слота РЦ)?\nНажмите «ОК» — вовремя, «Отмена» — с опозданием.');
    }

    this.logisticsService.updateShipmentStatus(shipmentId, newStatus, onTime);
  }

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