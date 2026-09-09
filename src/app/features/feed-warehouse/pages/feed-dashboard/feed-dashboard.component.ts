import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedWarehouseService } from '../../services/feed-warehouse.service';
import { PoultryManagementService } from '../../../poultry-management/services/poultry-management.service';
import { FeedLog } from '../../interfaces/feed-warehouse.interface';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-feed-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-dashboard.component.html',
  styleUrl: './feed-dashboard.component.css'
})
export class FeedDashboardComponent {
  protected readonly feedService = inject(FeedWarehouseService);
  protected readonly poultryService = inject(PoultryManagementService);
  private readonly exportService = inject(ExportService);
  private readonly toastService = inject(ToastService);

  readonly silos = this.feedService.silos;
  readonly totalFeedTons = this.feedService.totalFeedTons;
  readonly totalCapacityTons = this.feedService.totalCapacityTons;
  readonly totalFeedValueRub = this.feedService.totalFeedValueRub;
  readonly poultryHouses = this.poultryService.houses;

  // Форма пополнения (производство партии комбикорма)
  replenishSiloId = 'silo-1';
  replenishTons: number | null = null;
  readonly isReplenishing = signal<boolean>(false);

  // Форма списания (раздача в птичник)
  selectedHouseId = this.poultryHouses()[0]?.id ?? 'house-1';
  deductHouseName = this.poultryHouses()[0]?.name ?? 'Птичник № 1 (Промышленная несушка)';
  deductBirdType: 'layer' | 'broiler' | 'rearing' = this.poultryHouses()[0]?.birdType ?? 'layer';
  deductAgeDays: number = this.poultryHouses()[0]?.ageDays ?? 180;
  deductTons: number | null = null;
  readonly isDeducting = signal<boolean>(false);

  // Фильтрация журнала
  searchQuery = '';

  readonly filteredLogs = computed(() => {
    const list = this.feedService.feedLogs();
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) return list;

    return list.filter((log: FeedLog) =>
      log.houseName.toLowerCase().includes(query) ||
      log.recipeCode.toLowerCase().includes(query) ||
      log.date.toLowerCase().includes(query)
    );
  });

  onHouseChange(): void {
    const house = this.poultryHouses().find(h => h.id === this.selectedHouseId);
    if (house) {
      this.deductHouseName = house.name;
      this.deductBirdType = house.birdType;
      this.deductAgeDays = house.ageDays;
    }
  }

  submitReplenish(): void {
    if (this.isReplenishing()) return;

    const tons = Number(this.replenishTons);
    if (isNaN(tons) || tons <= 0) {
      this.toastService.show('Укажите корректный объём производства комбикорма больше нуля.', 'error');
      return;
    }

    this.isReplenishing.set(true);
    try {
      const ok = this.feedService.replenishSilo(this.replenishSiloId, tons);
      if (ok) {
        this.toastService.show(`Комбикорм (${tons} т) успешно произведён и закачан в силос.`);
        this.replenishTons = null;
      } else {
        this.toastService.show('Ошибка пополнения: силос переполнен или не найден.', 'error');
      }
    } finally {
      this.isReplenishing.set(false);
    }
  }

  submitDeduct(): void {
    if (this.isDeducting()) return;

    const tons = Number(this.deductTons);
    if (isNaN(tons) || tons <= 0) {
      this.toastService.show('Укажите корректный объём списания корма больше нуля.', 'error');
      return;
    }

    this.isDeducting.set(true);
    try {
      const ok = this.feedService.deductFeedForHouse(
        this.deductHouseName,
        this.deductBirdType,
        this.deductAgeDays,
        tons
      );

      if (ok) {
        this.toastService.show(`Корм (${tons} т) успешно списан на «${this.deductHouseName}».`);
        this.deductTons = null;
      } else {
        this.toastService.show(`Недостаточно корма требуемой рецептуры для «${this.deductHouseName}». Проверьте остатки.`, 'error');
      }
    } finally {
      this.isDeducting.set(false);
    }
  }

  exportToExcel(): void {
    const data = this.filteredLogs();
    if (data.length === 0) return;

    const headers = [
      'Время / Дата списания',
      'Целевой птичник',
      'Рецептура комбикорма',
      'Списано (тонн)'
    ];

    const rows = data.map((l: FeedLog) => [
      l.date,
      l.houseName,
      l.recipeCode,
      l.tonsDeducted
    ]);

    this.exportService.exportToCsv(headers, rows, 'Журнал_списания_кормов');
  }
}