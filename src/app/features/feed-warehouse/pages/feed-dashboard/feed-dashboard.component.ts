import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedWarehouseService } from '../../services/feed-warehouse.service';

@Component({
  selector: 'app-feed-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feed-dashboard.component.html',
  styleUrl: './feed-dashboard.component.css'
})
export class FeedDashboardComponent {
  protected readonly feedService = inject(FeedWarehouseService);

  readonly recipes = this.feedService.recipes;
  readonly batchLogs = this.feedService.batchLogs;
  readonly totalProducedTodayTons = this.feedService.totalProducedTodayTons;
  readonly silos = this.feedService.availableSilos;

  // Поля формы производства замеса
  selectedRecipeCode = 'ПК-1-1';
  productionTons = 6.0;
  targetHouse = 'Птичник № 1';

  successMessage = signal<string | null>(null);

  startProduction(): void {
    if (this.productionTons <= 0) return;

    const ok = this.feedService.produceFeedBatch(
      this.selectedRecipeCode,
      this.productionTons,
      this.targetHouse
    );

    if (ok) {
      this.successMessage.set(
        `Замес ${this.productionTons} т комбикорма (${this.selectedRecipeCode}) успешно изготовлен! Сырьё списано с элеватора.`
      );
      setTimeout(() => this.successMessage.set(null), 5000);
    }
  }
}