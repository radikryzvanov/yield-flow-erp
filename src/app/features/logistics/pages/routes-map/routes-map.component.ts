import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogisticsService } from '../../services/logistics.service';
import { ShipmentOrder } from '../../interfaces/logistics.interface';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';

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
  private readonly toastService = inject(ToastService);

  readonly shipments = this.logisticsService.shipments;
  readonly fleet = this.logisticsService.fleet;
  readonly shippedTons = this.logisticsService.totalDailyShippedTons;
  readonly activeVehicles = this.logisticsService.activeVehiclesCount;
  readonly onTimeRate = this.logisticsService.onTimeRatePercent;
  readonly mercuryDocs = this.logisticsService.approvedMercuryDocsCount;

  // Модальное окно создания отгрузки
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isCreatingShipment = signal<boolean>(false);

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
    if (this.isCreatingShipment()) return;

    const qty = Number(this.newQuantityUnits);
    if (!this.newClientName.trim()) {
      this.toastService.show('Укажите наименование клиента / РЦ.', 'error');
      return;
    }

    if (isNaN(qty) || qty <= 0) {
      this.toastService.show('Объём отгрузки должен быть числом больше нуля.', 'error');
      return;
    }

    this.isCreatingShipment.set(true);
    try {
      this.logisticsService.createShipment({
        clientName: this.newClientName.trim(),
        destinationCity: this.newDestinationCity.trim(),
        productType: this.newProductType.trim(),
        quantityUnits: qty,
        unit: this.newUnit,
        carrierVehicle: this.newCarrierVehicle,
        driverName: this.newDriverName.trim(),
        tempInsideCelsius: Number(this.newTempInside) || 4.0,
        departureTime: this.newDepartureTime.trim(),
        shippingStatus: this.newStatus
      });

      this.toastService.show(`Накладная и ВСД для «${this.newClientName.trim()}» успешно сформированы.`);
      this.closeCreateModal();
    } finally {
      this.isCreatingShipment.set(false);
    }
  }

  onStatusChange(shipmentId: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as ShipmentOrder['shippingStatus'];
    let onTime: boolean | undefined = undefined;

    if (newStatus === 'delivered') {
      onTime = confirm('Заказ доставлен вовремя (в рамках тайм-слота РЦ)?\nНажмите «ОК» — вовремя, «Отмена» — с опозданием.');
    }

    this.logisticsService.updateShipmentStatus(shipmentId, newStatus, onTime);
    this.toastService.show(`Статус рейса ${shipmentId} обновлён на: ${this.getShipmentStatusBadge(newStatus)}.`);
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