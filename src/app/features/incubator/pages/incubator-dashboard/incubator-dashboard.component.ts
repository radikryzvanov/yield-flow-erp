import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncubatorService } from '../../services/incubator.service';
import { StartIncubationPayload } from '../../interfaces/incubator.interface';

@Component({
  selector: 'app-incubator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incubator-dashboard.component.html',
  styleUrl: './incubator-dashboard.component.css'
})
export class IncubatorDashboardComponent {
  protected readonly incubatorService = inject(IncubatorService);

  readonly cabinets = this.incubatorService.cabinets;
  readonly batches = this.incubatorService.batches;
  readonly hatchHistory = this.incubatorService.hatchHistory;
  readonly totalEggsInIncubation = this.incubatorService.totalEggsInIncubation;
  readonly warningCabinetsCount = this.incubatorService.warningCabinetsCount;
  readonly activeSettersCount = this.incubatorService.activeSettersCount;
  readonly averageHatchability = this.incubatorService.averageHatchability;

  newBatchForm: StartIncubationPayload = {
    cabinetId: 'cab-04',
    batchNumber: 'ИНК-2026-16',
    eggSourceHouse: 'Птичник № 1',
    eggsCount: 19200
  };

  onSubmit(): void {
    if (!this.newBatchForm.cabinetId || this.newBatchForm.eggsCount <= 0) {
      return;
    }
    this.incubatorService.startIncubation(this.newBatchForm);
  }
}