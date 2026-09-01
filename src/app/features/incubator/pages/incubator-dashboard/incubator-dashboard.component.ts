import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncubatorService } from '../../services/incubator.service';
import { IncubationLog } from '../../interfaces/incubator.interface';

@Component({
  selector: 'app-incubator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incubator-dashboard.component.html',
  styleUrl: './incubator-dashboard.component.css'
})
export class IncubatorDashboardComponent {
  protected readonly incubatorService = inject(IncubatorService);

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

  // Экспорт журнала вывода в Excel (.csv UTF-8 BOM)
  exportToExcel(): void {
    const data = this.filteredLogs();
    if (data.length === 0) return;

    const headers = [
      '№ Вывода',
      'Дата завершения',
      'Партия ИЯ',
      'Кросс',
      'Заложено яиц (шт)',
      'Выведено цыплят (гол)',
      'Фактический вывод (%)',
      'Корпус назначения'
    ];

    const rows = data.map((log: IncubationLog) => [
      `"${log.id}"`,
      `"${log.date}"`,
      `"${log.batchNumber}"`,
      `"${log.crossType}"`,
      log.eggsSet,
      log.chicksHatched,
      log.actualHatchRate.toString().replace('.', ','),
      `"${log.destinationHouse}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Журнал_вывода_цыплят_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}