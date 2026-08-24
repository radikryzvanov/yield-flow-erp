import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncubatorService } from '../../services/incubator.service';

@Component({
  selector: 'app-incubator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incubator-dashboard.component.html',
  styleUrl: './incubator-dashboard.component.css',
})
export class IncubatorDashboardComponent {
  protected readonly incubatorService = inject(IncubatorService);

  readonly units = this.incubatorService.units;
  readonly hatchHistory = this.incubatorService.hatchHistory;
  readonly totalEggsInIncubation = this.incubatorService.totalEggsInIncubation;
  readonly averageHatchability = this.incubatorService.averageHatchability;

  // Данные формы закладки партии
  selectedUnitId = 'inc-3';
  batchNumber = `ИНК-2026-${Math.floor(100 + Math.random() * 900)}`;
  eggsCount = 42000;
  operatorName = 'Ковалев Д. И.';

  submitIncubation(): void {
    if (!this.selectedUnitId || this.eggsCount <= 0 || !this.operatorName) {
      return;
    }

    this.incubatorService.startIncubation({
      unitId: this.selectedUnitId,
      batchNumber: this.batchNumber,
      eggsCount: this.eggsCount,
      operatorName: this.operatorName,
    });

    // Генерация нового номера партии для следующей операции
    this.batchNumber = `ИНК-2026-${Math.floor(100 + Math.random() * 900)}`;
    this.eggsCount = 40000;
  }
}