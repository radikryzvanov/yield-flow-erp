import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlaughterService } from '../../services/slaughter.service';
import { ExportService } from '../../../../shared/services/export.service';
import { SlaughterBatchLog } from '../../interfaces/slaughter.interface';

@Component({
  selector: 'app-slaughter-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slaughter-dashboard.component.html',
  styleUrl: './slaughter-dashboard.component.css'
})
export class SlaughterDashboardComponent {
  protected readonly slaughterService = inject(SlaughterService);
  private readonly exportService = inject(ExportService);

  readonly lines = this.slaughterService.lines;
  readonly products = this.slaughterService.products;
  readonly logs = this.slaughterService.logs;
  readonly pendingDelivery = this.slaughterService.pendingDelivery;
  readonly totalMeatYieldKg = this.slaughterService.totalMeatYieldKg;
  readonly totalSlaughterRevenueRub = this.slaughterService.totalSlaughterRevenueRub;

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