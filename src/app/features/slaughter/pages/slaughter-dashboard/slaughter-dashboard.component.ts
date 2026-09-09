import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlaughterService } from '../../services/slaughter.service';
import { PoultryManagementService } from '../../../poultry-management/services/poultry-management.service';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';
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
  private readonly toastService = inject(ToastService);

  readonly lines = this.slaughterService.lines;
  readonly products = this.slaughterService.products;
  readonly logs = this.slaughterService.logs;
  readonly pendingDelivery = this.slaughterService.pendingDelivery;
  readonly totalMeatYieldKg = this.slaughterService.totalMeatYieldKg;
  readonly totalSlaughterRevenueRub = this.slaughterService.totalSlaughterRevenueRub;
  readonly poultryHouses = this.poultryService.houses;

  // Управление формой приёмки новой партии
  readonly isDeliveryModalOpen = signal<boolean>(false);
  readonly isDelivering = signal<boolean>(false);
  readonly isProcessingBatch = signal<boolean>(false);

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
    if (this.isDelivering()) return;

    const count = Number(this.birdsCountInput);
    const weight = Number(this.averageWeightInput);

    if (isNaN(count) || count <= 0 || isNaN(weight) || weight <= 0) {
      this.toastService.show('Поголовье и средний вес птицы должны быть положительными числами.', 'error');
      return;
    }

    this.isDelivering.set(true);
    try {
      const houseName = this.customSourceHouse.trim() || 'Транспортный цех';

      const success = this.slaughterService.addIncomingDelivery({
        sourceHouse: houseName,
        birdsCount: count,
        averageWeightKg: weight
      });

      if (success) {
        if (this.selectedHouseId) {
          this.poultryService.submitDailyReport({
            houseId: this.selectedHouseId,
            mortalityCount: count
          });
        }
        this.toastService.show(`Партия птицы (${count} гол.) принята в зону навески.`);
        this.closeDeliveryModal();
      } else {
        this.toastService.show('Не удалось зарегистрировать партию.', 'error');
      }
    } finally {
      this.isDelivering.set(false);
    }
  }

  startBatch(deliveryId: string): void {
    if (this.isProcessingBatch()) return;

    this.isProcessingBatch.set(true);
    try {
      this.slaughterService.startBatchProcessing(deliveryId);
      this.toastService.show('Навеска и убой запущены: линия в работе, склад пополнен.');
    } finally {
      this.isProcessingBatch.set(false);
    }
  }

  setLineState(lineId: string, state: 'running' | 'paused' | 'sanitization'): void {
    this.slaughterService.toggleLineStatus(lineId, state);
    this.toastService.show(`Режим линии изменён на: ${state === 'running' ? 'В работе' : state === 'paused' ? 'Останов' : 'Мойка'}.`);
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