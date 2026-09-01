import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PoultryManagementService, PoultryHouse } from '../../services/poultry-management.service';
import { EggWarehouseService } from '../../services/egg-warehouse.service';

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

  readonly houses = this.poultryService.houses;
  readonly totalBirds = this.poultryService.totalBirds;
  readonly totalDailyEggs = this.poultryService.totalDailyEggs;
  readonly totalDailyFeedTons = this.poultryService.totalDailyFeedTons;
  readonly averageLayingRate = this.poultryService.averageLayingRate;

  // Состояние модального окна отчёта
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

    // 1. Обновляем показатели в птичнике
    this.poultryService.submitDailyReport({
      houseId: house.id,
      mortalityCount: Number(this.mortalityInput),
      dailyEggCount: eggCount,
      feedPerBirdGrams: Number(this.feedInput),
      temperature: Number(this.tempInput)
    });

    // 2. Если птичник сдал яйца, отправляем партию на склад яйца
    if (house.birdType === 'layer' && eggCount > 0) {
      this.eggWarehouseService.registerIncomingEggs(house.name, eggCount);
    }

    this.closeModal();
  }

  getAgeWeeks(days: number): number {
    return Math.floor(days / 7);
  }

  isTemperatureNormal(actual: number, target: number): boolean {
    return Math.abs(actual - target) <= 1.0;
  }
}