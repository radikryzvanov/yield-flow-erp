import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlaughterService } from '../../services/slaughter.service';
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

  readonly lines = this.slaughterService.lines;
  readonly products = this.slaughterService.products;
  readonly totalLiveWeight = this.slaughterService.totalLiveWeightTodayTons;
  readonly totalMeatYield = this.slaughterService.totalMeatYieldKg;
  readonly slaughterRevenue = this.slaughterService.totalSlaughterRevenueRub;
  readonly avgYieldPercent = this.slaughterService.averageYieldPercent;

  // Сигналы фильтрации журнала
  readonly searchQuery = signal<string>('');
  readonly selectedVetStatus = signal<string>('ALL');

  // Отфильтрованный журнал убоя
  readonly filteredLogs = computed(() => {
    const list = this.slaughterService.logs();
    const query = this.searchQuery().trim().toLowerCase();
    const vet = this.selectedVetStatus();

    return list.filter((log: SlaughterBatchLog) => {
      const matchesSearch =
        query === '' ||
        log.id.toLowerCase().includes(query) ||
        log.sourceHouse.toLowerCase().includes(query);

      const matchesVet = vet === 'ALL' || log.vetInspectionStatus === vet;

      return matchesSearch && matchesVet;
    });
  });

  // Экспорт производственного отчета цеха убоя в Excel (.csv UTF-8 BOM)
  exportToExcel(): void {
    const logs = this.filteredLogs();
    const products = this.products();

    const lines: string[] = [];

    // Блок 1: Сортировка мяса и субпродуктов
    lines.push('=== СОРТИРОВКА ПРОДУКЦИИ ПО КАТЕГОРИЯМ ГОСТ 31962 ===');
    lines.push(['Категория', 'Выход (кг)', 'Доля (%)', 'Цена (руб/кг)', 'Выручка (руб)', 'Назначение'].join(';'));
    products.forEach(p => {
      lines.push([
        `"${p.category}"`,
        p.yieldKg,
        p.sharePercent,
        p.pricePerKgRub,
        p.yieldKg * p.pricePerKgRub,
        `"${p.destination}"`
      ].join(';'));
    });

    lines.push('');
    // Блок 2: Журнал завершенных партий убоя
    lines.push('=== ЖУРНАЛ ЗАВЕРШЕННЫХ ПАРТИЙ УБОЯ ===');
    lines.push(['№ Партии', 'Дата/Смена', 'Птичник (источник)', 'Поголовье (гол)', 'Живой вес (т)', 'Выход мяса (т)', '1-й сорт (%)', 'Ветконтроль'].join(';'));
    logs.forEach(l => {
      lines.push([
        `"${l.id}"`,
        `"${l.date}"`,
        `"${l.sourceHouse}"`,
        l.birdsCount,
        l.totalLiveWeightTons.toString().replace('.', ','),
        l.totalMeatYieldTons.toString().replace('.', ','),
        l.firstGradePercent.toString().replace('.', ','),
        l.vetInspectionStatus === 'passed' ? '"Пройден (ГОСТ)"' : '"Отбраковка"'
      ].join(';'));
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Отчет_убойного_цеха_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}