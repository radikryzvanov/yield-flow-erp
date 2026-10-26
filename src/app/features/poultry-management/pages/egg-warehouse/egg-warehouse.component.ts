import { ChangeDetectionStrategy, Component, inject, signal, computed, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EggWarehouseService } from '../../services/egg-warehouse.service';
import { PoultryManagementService } from '../../services/poultry-management.service';
import { IncomingEggBatch } from '../../interfaces/egg-warehouse.interface';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { apiErrorMessage } from '../../../../core/api/api-error';

@Component({
  selector: 'app-egg-warehouse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, FormsModule],
  templateUrl: './egg-warehouse.component.html',
  styleUrl: './egg-warehouse.component.css'
})
export class EggWarehouseComponent {
  protected readonly warehouseService = inject(EggWarehouseService);
  protected readonly poultryService = inject(PoultryManagementService);
  private readonly exportService = inject(ExportService);
  private readonly toastService = inject(ToastService);

  readonly stocks = this.warehouseService.stocks;
  readonly totalStockEggs = this.warehouseService.totalStockEggs;
  readonly totalPendingRawEggs = this.warehouseService.totalPendingRawEggs;
  readonly poultryHouses = this.poultryService.houses;

  // Форма ручной приёмки партии валового сбора (выбирается id птичника)
  readonly newBatchHouseId = signal<string>('');
  newBatchCount: number | null = null;

  constructor() {
    // Птичники приходят с сервера не сразу: как только список загрузился, выбираем первый по умолчанию.
    effect(() => {
      const first = this.poultryHouses()[0];
      if (first && !this.newBatchHouseId()) {
        this.newBatchHouseId.set(first.id);
      }
    });
  }
  readonly isSaving = signal<boolean>(false);

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
    if (this.isSaving()) return;

    const count = Number(this.newBatchCount);
    if (isNaN(count) || count <= 0) {
      this.toastService.show('Укажите корректное количество яйца больше нуля.', 'error');
      return;
    }

    const houseId = this.newBatchHouseId();
    if (!houseId) {
      this.toastService.show('Выберите птичник-источник.', 'error');
      return;
    }

    this.isSaving.set(true);
    this.warehouseService.registerIncomingEggs(houseId, count).subscribe({
      next: batch => {
        this.toastService.show(`Партия вала (${count} шт) от «${batch.houseName}» успешно принята.`);
        this.newBatchCount = null;
        this.isSaving.set(false);
      },
      error: (error: unknown) => {
        this.toastService.show(apiErrorMessage(error, 'Не удалось принять партию.'), 'error');
        this.isSaving.set(false);
      }
    });
  }

  sortBatch(batchId: string): void {
    this.warehouseService.sortBatch(batchId).subscribe({
      next: () => this.toastService.show('Партия рассортирована по товарным категориям ГОСТ.'),
      error: (error: unknown) =>
        this.toastService.show(apiErrorMessage(error, 'Не удалось рассортировать партию.'), 'error')
    });
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