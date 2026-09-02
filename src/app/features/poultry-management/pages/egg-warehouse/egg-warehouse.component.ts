import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EggWarehouseService } from '../../services/egg-warehouse.service';
import { IncomingEggBatch } from '../../interfaces/egg-warehouse.interface';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-egg-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './egg-warehouse.component.html',
  styleUrl: './egg-warehouse.component.css'
})
export class EggWarehouseComponent {
  protected readonly warehouseService = inject(EggWarehouseService);
  private readonly exportService = inject(ExportService);

  readonly stocks = this.warehouseService.stocks;
  readonly totalStockEggs = this.warehouseService.totalStockEggs;
  readonly totalPendingRawEggs = this.warehouseService.totalPendingRawEggs;

  // Форма ручной приёмки партии валового сбора
  newBatchHouse = 'Птичник № 1 (Промышленная несушка)';
  newBatchCount: number | null = null;

  // Сигналы фильтрации
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  // Отфильтрованные входящие партии
  readonly filteredBatches = computed(() => {
    const list = this.warehouseService.incomingBatches();
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();

    return list.filter((batch: IncomingEggBatch) => {
      const matchesSearch =
        query === '' ||
        batch.houseName.toLowerCase().includes(query) ||
        batch.date.toLowerCase().includes(query);

      const matchesStatus = status === 'ALL' || batch.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  submitNewBatch(): void {
    const count = Number(this.newBatchCount);
    if (!count || count <= 0) return;

    this.warehouseService.registerIncomingEggs(this.newBatchHouse, count);
    this.newBatchCount = null;
  }

  sortBatch(batchId: string): void {
    this.warehouseService.sortBatch(batchId);
  }

  exportToExcel(): void {
    const data = this.filteredBatches();
    if (data.length === 0) return;

    const headers = [
      'Время / Дата поступления',
      'Источник (Птичник)',
      'Количество валового яйца (шт)',
      'Статус обработки'
    ];

    const rows = data.map((b: IncomingEggBatch) => [
      b.date,
      b.houseName,
      b.rawEggCount,
      b.status === 'pending' ? 'Ожидает калибровки' : 'Рассортировано'
    ]);

    this.exportService.exportToCsv(headers, rows, 'Отчет_приемки_валового_яйца');
  }
}