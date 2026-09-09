import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoultryManagementService, PoultryHouse } from '../../services/poultry-management.service';
import { FeedWarehouseService } from '../../../feed-warehouse/services/feed-warehouse.service';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-poultry-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poultry-list.component.html',
  styleUrls: ['./poultry-list.component.css']
})
export class PoultryListComponent {
  protected readonly poultryService = inject(PoultryManagementService);
  private readonly feedWarehouseService = inject(FeedWarehouseService);
  private readonly exportService = inject(ExportService);
  private readonly toastService = inject(ToastService);

  readonly houses = this.poultryService.houses;
  readonly totalBirds = this.poultryService.totalBirds;
  readonly totalDailyEggs = this.poultryService.totalDailyEggs;
  readonly totalDailyFeedTons = this.poultryService.totalDailyFeedTons;
  readonly averageLayingRate = this.poultryService.averageLayingRate;

  // Сигналы фильтрации
  readonly searchQuery = signal<string>('');
  readonly selectedBirdType = signal<string>('ALL');

  // Модальное окно суточного отчёта
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedHouse = signal<PoultryHouse | null>(null);
  readonly isSaving = signal<boolean>(false);

  // Поля формы
  eggsInput: number = 0;
  mortalityInput: number = 0;
  feedInput: number = 0;
  tempInput: number = 21.0;

  readonly filteredHouses = computed(() => {
    const list = this.houses();
    const query = this.searchQuery().trim().toLowerCase();
    const type = this.selectedBirdType();

    return list.filter((house: PoultryHouse) => {
      const matchesSearch =
        query === '' ||
        house.name.toLowerCase().includes(query) ||
        house.crossType.toLowerCase().includes(query) ||
        house.id.toLowerCase().includes(query);

      const matchesType = type === 'ALL' || house.birdType === type;

      return matchesSearch && matchesType;
    });
  });

  openReportModal(house: PoultryHouse): void {
    this.selectedHouse.set(house);
    this.eggsInput = house.dailyEggCount;
    this.mortalityInput = 0;
    this.feedInput = house.feedPerBirdGrams;
    this.tempInput = house.temperature;
    this.isModalOpen.set(true);
  }

  closeReportModal(): void {
    this.isModalOpen.set(false);
    this.selectedHouse.set(null);
  }

  saveReport(): void {
    if (this.isSaving()) return;

    const house = this.selectedHouse();
    if (!house) return;

    const eggCount = Number(this.eggsInput);
    const feedGrams = Number(this.feedInput);
    const mortality = Number(this.mortalityInput);
    const temp = Number(this.tempInput);

    if (
      isNaN(mortality) || mortality < 0 ||
      isNaN(eggCount) || eggCount < 0 ||
      isNaN(feedGrams) || feedGrams < 0 ||
      isNaN(temp)
    ) {
      this.toastService.show('Показатели не могут быть отрицательными. Проверьте введённые данные.', 'error');
      return;
    }

    if (mortality > house.birdCount) {
      this.toastService.show(`Падёж (${mortality} гол.) не может превышать текущее поголовье (${house.birdCount} гол.).`, 'error');
      return;
    }

    this.isSaving.set(true);
    try {
      const totalFeedTons = Math.round(((house.birdCount * feedGrams) / 1_000_000) * 100) / 100;

      if (totalFeedTons > 0) {
        const feedOk = this.feedWarehouseService.deductFeedForHouse(
          house.name,
          house.birdType,
          house.ageDays,
          totalFeedTons
        );
        if (!feedOk) {
          this.toastService.show(`Внимание: на складе кормов недостаточно комбикорма для «${house.name}».`, 'error');
        }
      }

      this.poultryService.submitDailyReport({
        houseId: house.id,
        dailyEggCount: eggCount,
        mortalityCount: mortality,
        feedPerBirdGrams: feedGrams,
        temperature: temp
      });

      this.toastService.show(`Отчёт по «${house.name}» успешно сохранён.`);
      this.closeReportModal();
    } finally {
      this.isSaving.set(false);
    }
  }

  exportToExcel(): void {
    const data = this.filteredHouses();
    if (data.length === 0) return;

    const headers = [
      'ID',
      'Наименование корпуса',
      'Направление',
      'Кросс птицы',
      'Возраст (дней)',
      'Поголовье (гол)',
      'Сбор яйца (шт)',
      'Яйценоскость (%)',
      'Корм (г/гол)',
      't° в зале (°C)',
      'Сохранность (%)'
    ];

    const rows = data.map((h: PoultryHouse) => {
      const safetyPercent =
        h.initialBirdCount > 0
          ? Math.round((h.birdCount / h.initialBirdCount) * 1000) / 10
          : 100;

      return [
        h.id,
        h.name,
        h.birdType === 'layer' ? 'Несушка' : h.birdType === 'broiler' ? 'Бройлер' : 'Молодняк',
        h.crossType,
        h.ageDays,
        h.birdCount,
        h.dailyEggCount,
        `${h.actualLayingRatePercent}%`,
        h.feedPerBirdGrams,
        h.temperature,
        `${safetyPercent}%`
      ];
    });

    this.exportService.exportToCsv(headers, rows, 'Реестр_птичников_YieldFlow');
  }
}