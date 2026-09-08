import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlaughterService } from '../../services/slaughter.service';
import { PoultryManagementService } from '../../../poultry-management/services/poultry-management.service';
import { ExportService } from '../../../../shared/services/export.service';
import { SlaughterBatchLog } from '../../interfaces/slaughter.interface';

@Component({
  selector: 'app-slaughter-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slaughter-dashboard.component.html',
  styleUrl: './slaughter-dashboard.component.css'
})
export class SlaughterDashboardComponent {
  protected readonly slaughterService = inject(SlaughterService);
  protected readonly poultryService = inject(PoultryManagementService);
  private readonly exportService = inject(ExportService);

  readonly lines = this.slaughterService.lines;
  readonly products = this.slaughterService.products;
  readonly logs = this.slaughterService.logs;
  readonly pendingDelivery = this.slaughterService.pendingDelivery;
  readonly totalMeatYieldKg = this.slaughterService.totalMeatYieldKg;
  readonly totalSlaughterRevenueRub = this.slaughterService.totalSlaughterRevenueRub;
  readonly poultryHouses = this.poultryService.houses;

  // Управление формой приёмки новой партии
  readonly isDeliveryModalOpen = signal<boolean>(false);

  // Поля формы
  selectedHouseId: string = '';
  customSourceHouse: string = '';
  birdsCountInput: number | null = 15000;
  averageWeightInput: number = 1.95;

  openDeliveryModal(): void {
    const defaultHouse = this.poultryHouses().find(h => h.birdType === 'broiler' || h.birdType === 'layer');
    this.selectedHouseId = defaultHouse ? defaultHouse.id : '';
    this.customSourceHouse = defaultHouse ? defaultHouse.name : 'Птичник № 4 (Бройлер)';
    this.birdsCountInput = defaultHouse ? Math.min(defaultHouse.birdCount, 15000) : 15000;
    this.averageWeightInput = defaultHouse?.birdType === 'broiler' ? 2.45 : 1.85;
    this.isDeliveryModalOpen.set(true);
  }

  closeDeliveryModal(): void {
    this.isDeliveryModalOpen.set(false);
  }

  onHouseSelectChange(): void {
    const house = this.poultryHouses().find(h => h.id === this.selectedHouseId);
    if (house) {
      this.customSourceHouse = house.name;
      this.birdsCountInput = Math.min(house.birdCount, 15000);
      this.averageWeightInput = house.birdType === 'broiler' ? 2.45 : 1.85;
    }
  }

  submitDelivery(): void {
    const count = Number(this.birdsCountInput);
    const weight = Number(this.averageWeightInput);

    if (!count || count <= 0 || !weight || weight <= 0) {
      alert('Укажите корректное поголовье и средний вес птицы.');
      return;
    }

    const houseName = this.customSourceHouse.trim() || 'Транспортный цех';

    const success = this.slaughterService.addIncomingDelivery({
      sourceHouse: houseName,
      birdsCount: count,
      averageWeightKg: weight
    });

    if (success) {
      // Списание птицы из птичника при отгрузке на убой
      if (this.selectedHouseId) {
        this.poultryService.submitDailyReport({
          houseId: this.selectedHouseId,
          mortalityCount: count // уменьшает активное поголовье птичника
        });
      }
      this.closeDeliveryModal();
    } else {
      alert('Не удалось зарегистрировать партию.');
    }
  }

  startBatch(deliveryId: string): void {
    this.slaughterService.startBatchProcessing(deliveryId);
  }

  setLineState(lineId: string, state: 'running' | 'paused' | 'sanitization'): void {
    this.slaughterService.toggleLineStatus(lineId, state);
  }

  exportToExcel(): void {
    const data = this.logs();
    if (data.length === 0) return;

    const headers = [
      'Дата / Смена',
      'Источник (Корпус)',
      'Поголовье (гол)',
      'Живой вес (т)',
      'Выход мяса (т)',
      'Выход 1 сорта (%)',
      'Ветэкспертиза'
    ];

    const rows = data.map((l: SlaughterBatchLog) => [
      l.date,
      l.sourceHouse,
      l.birdsCount,
      l.totalLiveWeightTons,
      l.totalMeatYieldTons,
      `${l.firstGradePercent}%`,
      l.vetInspectionStatus === 'passed' ? 'Допущено (Годно)' : 'Отклонено'
    ]);

    this.exportService.exportToCsv(headers, rows, 'Журнал_убойного_цеха');
  }
}