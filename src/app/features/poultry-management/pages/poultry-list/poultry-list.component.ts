import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoultryManagementService, PoultryHouse } from '../../services/poultry-management.service';
import { EggWarehouseService } from '../../services/egg-warehouse.service';
import { FeedWarehouseService } from '../../../feed-warehouse/services/feed-warehouse.service';

@Component({
  selector: 'app-poultry-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poultry-list.component.html',
  styleUrl: './poultry-list.component.css'
})
export class PoultryListComponent {
  protected readonly poultryService = inject(PoultryManagementService);
  protected readonly eggWarehouseService = inject(EggWarehouseService);
  protected readonly feedWarehouseService = inject(FeedWarehouseService);

  readonly houses = this.poultryService.houses;
  readonly totalBirds = this.poultryService.totalBirds;
  readonly totalDailyEggs = this.poultryService.totalDailyEggs;
  readonly totalDailyFeedTons = this.poultryService.totalDailyFeedTons;
  readonly averageLayingRate = this.poultryService.averageLayingRate;

  // Сигналы фильтрации
  readonly searchQuery = signal<string>('');
  readonly selectedType = signal<string>('ALL');

  // Отфильтрованный список корпусов
  readonly filteredHouses = computed(() => {
    const list = this.houses();
    const query = this.searchQuery().trim().toLowerCase();
    const type = this.selectedType();

    return list.filter((house: PoultryHouse) => {
      const matchesSearch =
        query === '' ||
        house.name.toLowerCase().includes(query) ||
        house.crossType.toLowerCase().includes(query);

      const matchesType = type === 'ALL' || house.birdType === type;

      return matchesSearch && matchesType;
    });
  });

  // Состояние модального окна отчета
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedHouse = signal<PoultryHouse | null>(null);

  // Поля формы
  mortalityInput: number = 0;
  eggsInput: number = 0;
  feedInput: number = 115;
  tempInput: number = 20.0;

  openReportModal(house: PoultryHouse) {
    this.selectedHouse.set(house);
    this.mortalityInput = 0;
    this.eggsInput = house.dailyEggCount;
    this.feedInput = house.feedPerBirdGrams;
    this.tempInput = house.temperature;
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedHouse.set(null);
  }

  saveReport() {
    const house = this.selectedHouse();
    if (!house) return;

    const eggCount = Number(this.eggsInput);
    const feedGrams = Number(this.feedInput);
    const mortality = Number(this.mortalityInput);
    const currentBirds = Math.max(0, house.birdCount - mortality);

    // 1. Обновляем показатели в птичнике
    this.poultryService.submitDailyReport({
      houseId: house.id,
      mortalityCount: mortality,
      dailyEggCount: eggCount,
      feedPerBirdGrams: feedGrams,
      temperature: Number(this.tempInput)
    });

    // 2. Отправляем партию на склад яйца
    if (house.birdType === 'layer' && eggCount > 0) {
      this.eggWarehouseService.registerIncomingEggs(house.name, eggCount);
    }

    // 3. Списываем съеденный комбикорм со склада кормов
    const totalFeedTons = Math.round(((currentBirds * feedGrams) / 1_000_000) * 100) / 100;
    if (totalFeedTons > 0) {
      this.feedWarehouseService.deductFeedForHouse(house.name, house.birdType, house.ageDays, totalFeedTons);
    }

    this.closeModal();
  }

  getAgeWeeks(days: number): number {
    return Math.floor(days / 7);
  }

  isTemperatureNormal(actual: number, target: number): boolean {
    return Math.abs(actual - target) <= 1.0;
  }

  // Экспорт технологической карты птичников в Excel (.csv UTF-8 BOM)
  exportToExcel(): void {
    const data = this.filteredHouses();
    if (data.length === 0) return;

    const headers = [
      'Корпус',
      'Кросс',
      'Тип стада',
      'Возраст (дней)',
      'Возраст (недель)',
      'Поголовье (голов)',
      'Сохранность (%)',
      'Яйценоскость факт (%)',
      'Яйценоскость план (%)',
      'Сбор яйца за сутки (шт)',
      'Расход корма факт (г/гол)',
      'Расход корма норма (г/гол)',
      'Температура факт (°C)',
      'Температура норма (°C)'
    ];

    const rows = data.map((h: PoultryHouse) => {
      const safetyPercent = (h.birdCount / h.initialBirdCount * 100).toFixed(1).replace('.', ',');
      return [
        `"${h.name}"`,
        `"${h.crossType}"`,
        h.birdType === 'layer' ? '"Промышленная несушка"' : '"Ремонтный молодняк"',
        h.ageDays,
        this.getAgeWeeks(h.ageDays),
        h.birdCount,
        safetyPercent,
        h.birdType === 'layer' ? h.actualLayingRatePercent.toString().replace('.', ',') : '"—"',
        h.birdType === 'layer' ? h.targetLayingRatePercent.toString().replace('.', ',') : '"—"',
        h.birdType === 'layer' ? h.dailyEggCount : 0,
        h.feedPerBirdGrams,
        h.targetFeedGrams,
        h.temperature.toString().replace('.', ','),
        h.targetTemperature.toString().replace('.', ',')
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Технологическая_карта_птичников_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}