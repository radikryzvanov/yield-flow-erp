import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VeterinaryService } from '../../services/veterinary.service';
import { VaccineScheduleItem, DrugStockItem, HealthCheckLog } from '../../interfaces/veterinary.interface';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';

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
  private readonly toastService = inject(ToastService);

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
  readonly isSavingLog = signal<boolean>(false);

  // Форма пополнения аптеки
  selectedDrugId: string = 'st-1';
  replenishAmount: number | null = 10000;
  readonly isReplenishingDrug = signal<boolean>(false);

  // Фильтрация графика вакцинаций
  scheduleFilter = 'ALL';

  readonly filteredSchedule = computed(() => {
    const list = this.schedule();
    if (this.scheduleFilter === 'ALL') return list;
    return list.filter((s: VaccineScheduleItem) => s.status === this.scheduleFilter);
  });

  // Отметка вакцинации как выполненной
  markVaccinated(id: string): void {
    const success = this.vetService.completeVaccination(id);
    if (success) {
      this.toastService.show('Вакцинация успешно проведена, препарат списан со склада.');
    } else {
      this.toastService.show('Не удалось списать препарат: проверьте наличие достаточного количества доз в аптеке.', 'error');
    }
  }

  // Отправка формы пополнения препарата
  submitReplenish(): void {
    if (this.isReplenishingDrug()) return;

    const amount = Number(this.replenishAmount);
    if (!this.selectedDrugId || isNaN(amount) || amount <= 0) {
      this.toastService.show('Укажите корректный объём пополнения больше нуля.', 'error');
      return;
    }

    this.isReplenishingDrug.set(true);
    try {
      const success = this.vetService.replenishDrugStock(this.selectedDrugId, amount);
      if (success) {
        this.toastService.show(`Запас препарата успешно пополнен на ${amount} доз/л.`);
        this.replenishAmount = null;
      } else {
        this.toastService.show('Препарат не найден в номенклатуре аптеки.', 'error');
      }
    } finally {
      this.isReplenishingDrug.set(false);
    }
  }

  // Отправка формы клинического осмотра
  submitHealthCheck(): void {
    if (this.isSavingLog()) return;

    const mortality = Number(this.newLogMortalityCount);
    const age = Number(this.newLogAgeWeeks);
    const rate = Number(this.newLogMortalityRate);

    if (isNaN(mortality) || mortality < 0 || isNaN(age) || age <= 0 || isNaN(rate) || rate < 0) {
      this.toastService.show('Падёж и возраст не могут быть отрицательными числами.', 'error');
      return;
    }

    this.isSavingLog.set(true);
    try {
      this.vetService.addHealthCheckLog({
        house: this.newLogHouse,
        flockAgeWeeks: age,
        mortalityCount: mortality,
        mortalityRatePercent: rate || 0.01,
        clinicalSigns: this.newLogSigns.trim() || 'Клинических отклонений не выявлено.',
        vetDoctor: this.newLogDoctor.trim() || 'Дежурный ветврач',
        quarantineStatus: this.newLogStatus
      });

      this.toastService.show(`Запись осмотра по «${this.newLogHouse}» внесена в ветжурнал.`);
      this.newLogMortalityCount = null;
      this.newLogSigns = '';
    } finally {
      this.isSavingLog.set(false);
    }
  }

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