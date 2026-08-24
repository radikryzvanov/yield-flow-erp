import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SlaughterService } from '../../services/slaughter.service';
import { SlaughterBatch, SlaughterYield } from '../../interfaces/slaughter.interface';

@Component({
  selector: 'app-slaughter-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './slaughter-dashboard.component.html',
  styleUrl: './slaughter-dashboard.component.css'
})
export class SlaughterDashboardComponent {
  protected readonly slaughterService = inject(SlaughterService);

  readonly pendingBatches = this.slaughterService.pendingBatches;
  readonly reports = this.slaughterService.reports;

  readonly totalMeatProcessedKg = this.slaughterService.totalMeatProcessedKg;
  readonly avgYieldPercentage = this.slaughterService.avgYieldPercentage;
  readonly totalCondemnedKg = this.slaughterService.totalCondemnedKg;

  // Выбранная для забоя партия
  selectedBatch: SlaughterBatch | null = null;

  // Поля ввода выхода переработки (кг)
  grade1Kg = 0;
  grade2Kg = 0;
  byProductsKg = 0;
  wasteKg = 0;
  condemnedKg = 0;

  selectBatch(batch: SlaughterBatch): void {
    this.selectedBatch = batch;
    // Предзаполнение примерными технологическими нормами (72% выход мяса)
    const estMeat = Math.round(batch.liveWeightKg * 0.72);
    this.grade1Kg = Math.round(estMeat * 0.88);
    this.grade2Kg = Math.round(estMeat * 0.12);
    this.byProductsKg = Math.round(batch.liveWeightKg * 0.06);
    this.condemnedKg = Math.round(batch.liveWeightKg * 0.01);
    this.wasteKg = batch.liveWeightKg - (this.grade1Kg + this.grade2Kg + this.byProductsKg + this.condemnedKg);
  }

  cancelSelection(): void {
    this.selectedBatch = null;
  }

  submitSlaughter(): void {
    if (!this.selectedBatch) return;

    const yieldData: SlaughterYield = {
      grade1Kg: this.grade1Kg,
      grade2Kg: this.grade2Kg,
      byProductsKg: this.byProductsKg,
      wasteKg: this.wasteKg,
      condemnedKg: this.condemnedKg
    };

    this.slaughterService.processSlaughter(this.selectedBatch.id, yieldData);
    this.selectedBatch = null;
  }
}