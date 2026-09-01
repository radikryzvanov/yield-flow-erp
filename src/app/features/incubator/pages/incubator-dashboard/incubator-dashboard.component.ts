import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncubatorService } from '../../services/incubator.service';
import { IncubationLog } from '../../interfaces/incubator.interface';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-incubator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incubator-dashboard.component.html',
  styleUrl: './incubator-dashboard.component.css'
})
export class IncubatorDashboardComponent {
  protected readonly incubatorService = inject(IncubatorService);
  private readonly exportService = inject(ExportService);

  readonly cabinets = this.incubatorService.cabinets;
  readonly totalEggs = this.incubatorService.totalEggsInIncubation;
  readonly activeCabinets = this.incubatorService.activeCabinetsCount;
  readonly hatchForecast = this.incubatorService.averageHatchForecast;
  readonly expectedChicks = this.incubatorService.expectedChicksCount;

  // Сигналы фильтрации журнала
  readonly searchQuery = signal<string>('');
  readonly selectedCross = signal<string>('ALL');

  // Отфильтрованный журнал завершённых выводов
  readonly filteredLogs = computed(() => {
    const list = this.incubatorService.logs();
    const query = this.searchQuery().trim().toLowerCase();
    const cross = this.selectedCross();

    return list.filter((log: IncubationLog) => {
      const matchesSearch =
        query === '' ||
        log.batchNumber.toLowerCase().includes(query) ||
        log.destinationHouse.toLowerCase().includes(query) ||
        log.id.toLowerCase().includes(query);

      const matchesCross = cross === 'ALL' || log.crossType === cross;

      return matchesSearch && matchesCross;
    });
  });

  getStatusLabel(status: string): string {
    switch (status) {
      case 'incubation': return 'Инкубация';
      case 'candling': return 'Миражирование / Перенос';
      case 'hatching': return 'Вывод цыплят';
      case 'sanitization': return 'Санобработка (Мойка)';
      default: return status;
    }
  }

  // Централизованный экспорт журнала вывода в Excel
  exportToExcel(): void {
    const data = this.filteredLogs();
    if (data.length === 0) return;

    const headers = [
      '№ Вывода',
      'Дата завершения',
      'Партия ИЯ',
      'Кросс птицы',
      'Заложено яиц (шт)',
      'Выведено цыплят (гол)',
      'Фактический вывод (%)',
      'Корпус назначения'
    ];

    const rows = data.map((log: IncubationLog) => [
      log.id,
      log.date,
      log.batchNumber,
      log.crossType,
      log.eggsSet,
      log.chicksHatched,
      log.actualHatchRate,
      log.destinationHouse
    ]);

    this.exportService.exportToCsv(headers, rows, 'Журнал_вывода_цыплят');
  }
}