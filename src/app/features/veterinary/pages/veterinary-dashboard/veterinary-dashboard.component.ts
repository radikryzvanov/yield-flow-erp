import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VeterinaryService } from '../../services/veterinary.service';
import { VaccineScheduleItem } from '../../interfaces/veterinary.interface';
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
  readonly pendingVaccinations = this.vetService.pendingVaccinationsCount;
  readonly totalMortality = this.vetService.totalDailyMortality;
  readonly livability = this.vetService.flockLivabilityPercent;

  readonly searchQuery = signal<string>('');
  readonly selectedStatus = signal<string>('ALL');

  readonly filteredSchedule = computed(() => {
    const list = this.schedule();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();

    return list.filter((item: VaccineScheduleItem) => {
      const matchesSearch =
        query === '' ||
        item.targetHouse.toLowerCase().includes(query) ||
        item.vaccineName.toLowerCase().includes(query) ||
        item.disease.toLowerCase().includes(query);

      const matchesStatus = status === 'ALL' || item.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  getMethodBadge(method: string): string {
    switch (method) {
      case 'water': return '💧 Выпойка с водой';
      case 'spray': return '💨 Аэрозольно (спрей)';
      case 'injection': return '💉 Инъекция';
      case 'in-ovo': return '🥚 In-ovo (в яйцо)';
      default: return method;
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'completed': return 'Выполнено';
      case 'urgent': return 'Требует внимания';
      case 'pending': return 'Запланировано';
      default: return status;
    }
  }

  exportToExcel(): void {
    const data = this.filteredSchedule();
    if (data.length === 0) return;

    const headers = [
      'ID записи',
      'Возраст (дней)',
      'Корпус / Объект',
      'Заболевание',
      'Препарат (Вакцина)',
      'Метод введения',
      'Дата обработки',
      'Дозировка (доз)',
      'Статус'
    ];

    const rows = data.map((s: VaccineScheduleItem) => [
      s.id,
      s.ageDays,
      s.targetHouse,
      s.disease,
      s.vaccineName,
      this.getMethodBadge(s.method),
      s.plannedDate,
      s.dosageDoses,
      this.getStatusBadge(s.status)
    ]);

    this.exportService.exportToCsv(headers, rows, 'График_вакцинаций');
  }
}