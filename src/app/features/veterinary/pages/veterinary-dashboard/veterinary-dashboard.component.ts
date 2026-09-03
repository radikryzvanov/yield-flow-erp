import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VeterinaryService } from '../../services/veterinary.service';
import { VaccineScheduleItem, DrugStockItem, HealthCheckLog } from '../../interfaces/veterinary.interface';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-veterinary-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './veterinary-dashboard.component.html',
  styleUrl: './veterinary-dashboard.component.css'
})
export class VeterinaryDashboardComponent {
  protected readonly vetService = inject(VeterinaryService);
  private readonly exportService = inject(ExportService);

  readonly schedule = this.vetService.schedule;
  readonly stock = this.vetService.stock;
  readonly logs = this.vetService.logs;

  readonly pendingVaccinationsCount = this.vetService.pendingVaccinationsCount;
  readonly totalDailyMortality = this.vetService.totalDailyMortality;
  readonly flockLivabilityPercent = this.vetService.flockLivabilityPercent;

  // Форма добавления клинического осмотра
  newLogHouse = 'Птичник № 1 (Несушка Ломанн)';
  newLogAgeWeeks: number = 34;
  newLogMortalityCount: number | null = null;
  newLogMortalityRate: number = 0.01;
  newLogSigns = '';
  newLogDoctor = 'Иванов С. М.';
  newLogStatus: 'normal' | 'observation' | 'quarantine' = 'normal';

  // Фильтрация графика вакцинаций
  scheduleFilter = 'ALL';

  readonly filteredSchedule = computed(() => {
    const list = this.schedule();
    if (this.scheduleFilter === 'ALL') return list;
    return list.filter((s: VaccineScheduleItem) => s.status === this.scheduleFilter);
  });

  // Отметка вакцинации как выполненной
  markVaccinated(id: string): void {
    this.vetService.completeVaccination(id);
  }

  // Отправка формы клинического осмотра
  submitHealthCheck(): void {
    if (this.newLogMortalityCount === null || this.newLogMortalityCount < 0) return;

    this.vetService.addHealthCheckLog({
      house: this.newLogHouse,
      flockAgeWeeks: Number(this.newLogAgeWeeks) || 1,
      mortalityCount: Number(this.newLogMortalityCount),
      mortalityRatePercent: Number(this.newLogMortalityRate) || 0.01,
      clinicalSigns: this.newLogSigns.trim() || 'Клинических отклонений не выявлено.',
      vetDoctor: this.newLogDoctor.trim() || 'Дежурный ветврач',
      quarantineStatus: this.newLogStatus
    });

    this.newLogMortalityCount = null;
    this.newLogSigns = '';
  }

  // Экспорт журнала осмотров в Excel
  exportLogsToExcel(): void {
    const data = this.logs();
    if (data.length === 0) return;

    const headers = [
      'Дата',
      'Корпус / Птичник',
      'Возраст (нед)',
      'Падёж (гол)',
      'Отход (%)',
      'Клинические признаки',
      'Ветврач',
      'Эпизоотический статус'
    ];

    const rows = data.map((l: HealthCheckLog) => [
      l.date,
      l.house,
      l.flockAgeWeeks,
      l.mortalityCount,
      `${l.mortalityRatePercent}%`,
      l.clinicalSigns,
      l.vetDoctor,
      l.quarantineStatus
    ]);

    this.exportService.exportToCsv(headers, rows, 'Журнал_ветеринарного_контроля');
  }
}