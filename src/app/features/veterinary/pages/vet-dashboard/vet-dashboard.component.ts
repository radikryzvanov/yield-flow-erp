import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VeterinaryService } from '../../services/veterinary.service';

@Component({
  selector: 'app-vet-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vet-dashboard.component.html',
  styleUrl: './vet-dashboard.component.css'
})
export class VetDashboardComponent {
  protected readonly vetService = inject(VeterinaryService);

  readonly vaccinations = this.vetService.vaccinations;
  readonly medications = this.vetService.medications;
  readonly mortalityLogs = this.vetService.mortalityLogs;

  readonly plannedCount = this.vetService.plannedVaccinationsCount;
  readonly lowStockAlerts = this.vetService.lowStockAlerts;
  readonly totalMortalityToday = this.vetService.totalMortalityToday;

  // Данные формы учета падежа
  houseId = 'Корпус № 1 (Бройлеры)';
  batchNumber = 'ПАРТИЯ-РОСС-308-А';
  count = 5;
  reason = 'Технологический отход (слабые цыплята)';

  completeVaccine(id: string): void {
    this.vetService.completeVaccination(id);
  }

  submitMortality(): void {
    if (this.count <= 0 || !this.houseId || !this.reason) {
      return;
    }

    this.vetService.addMortalityRecord({
      date: '2026-08-24',
      houseId: this.houseId,
      batchNumber: this.batchNumber,
      count: this.count,
      reason: this.reason
    });

    // Сброс количества на дефолтное значение
    this.count = 1;
  }
}