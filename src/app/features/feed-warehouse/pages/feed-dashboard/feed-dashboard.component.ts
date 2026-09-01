import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedWarehouseService } from '../../services/feed-warehouse.service';
import { FeedLog } from '../../interfaces/feed-warehouse.interface';

@Component({
  selector: 'app-feed-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-dashboard.component.html',
  styleUrl: './feed-dashboard.component.css'
})
export class FeedDashboardComponent {
  protected readonly feedService = inject(FeedWarehouseService);

  readonly silos = this.feedService.silos;
  readonly totalFeedTons = this.feedService.totalFeedTons;
  readonly totalFeedValueRub = this.feedService.totalFeedValueRub;

  // Сигналы фильтрации таблицы
  readonly searchQuery = signal<string>('');
  readonly selectedRecipe = signal<string>('ALL');

  // Отфильтрованный журнал списаний (computed)
  readonly filteredFeedLogs = computed(() => {
    const logs = this.feedService.feedLogs();
    const query = this.searchQuery().trim().toLowerCase();
    const recipe = this.selectedRecipe();

    return logs.filter((log: FeedLog) => {
      const matchesSearch =
        query === '' ||
        log.houseName.toLowerCase().includes(query) ||
        log.date.toLowerCase().includes(query);

      const matchesRecipe = recipe === 'ALL' || log.recipeCode === recipe;

      return matchesSearch && matchesRecipe;
    });
  });

  getFillPercent(current: number, capacity: number): number {
    return Math.round((current / capacity) * 100);
  }

  // Экспорт текущей таблицы в Excel (.csv с поддержкой кириллицы UTF-8 BOM)
  exportToExcel(): void {
    const data = this.filteredFeedLogs();
    if (data.length === 0) return;

    const headers = ['Время/Дата', 'Пункт назначения (Птичник)', 'Рецепт корма', 'Списано (тонн)'];
    const rows = data.map((log: FeedLog) => [
      `"${log.date}"`,
      `"${log.houseName}"`,
      `"${log.recipeCode}"`,
      log.tonsDeducted.toString().replace('.', ',') // Формат запятой для русского Excel
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Отчет_расхода_кормов_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}