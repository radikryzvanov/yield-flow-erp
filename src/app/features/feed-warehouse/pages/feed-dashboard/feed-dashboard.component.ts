import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedWarehouseService } from '../../services/feed-warehouse.service';
import { PoultryManagementService } from '../../../poultry-management/services/poultry-management.service';
import { FeedLog } from '../../interfaces/feed-warehouse.interface';
import { ExportService } from '../../../../shared/services/export.service';

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

  readonly silos = this.feedService.silos;
  readonly totalFeedTons = this.feedService.totalFeedTons;
  readonly totalCapacityTons = this.feedService.totalCapacityTons;
  readonly totalFeedValueRub = this.feedService.totalFeedValueRub;
  readonly poultryHouses = this.poultryService.houses;

  // Форма пополнения (производство партии комбикорма)
  replenishSiloId = 'silo-1';
  replenishTons: number | null = null;

  // Форма списания (C3: синхронизация с реальными птичниками)
  selectedHouseId = this.poultryHouses()[0]?.id ?? 'house-1';
  deductHouseName = this.poultryHouses()[0]?.name ?? 'Птичник № 1 (Промышленная несушка)';
  deductBirdType: 'layer' | 'broiler' | 'rearing' = this.poultryHouses()[0]?.birdType ?? 'layer';
  deductAgeDays: number = this.poultryHouses()[0]?.ageDays ?? 180;
  deductTons: number | null = null;

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
    const tons = Number(this.replenishTons);
    if (!tons || tons <= 0) return;

    const ok = this.feedService.replenishSilo(this.replenishSiloId, tons);
    if (ok) {
      this.replenishTons = null;
    }
  }

  submitDeduct(): void {
    const tons = Number(this.deductTons);
    if (!tons || tons <= 0) return;

    const ok = this.feedService.deductFeedForHouse(
      this.deductHouseName,
      this.deductBirdType,
      this.deductAgeDays,
      tons
    );

    if (ok) {
      this.deductTons = null;
    } else {
      alert(`Недостаточно корма требуемой рецептуры для «${this.deductHouseName}» в силосах.`);
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