import { Component, inject } from '@angular/core';
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

  readonly rawMaterials = this.feedService.rawMaterials;
  readonly recipes = this.feedService.recipes;
  readonly productionBatches = this.feedService.productionBatches;
  readonly totalStockTons = this.feedService.totalStockTons;

  selectedRecipeCode = 'ПК-1-1';
  targetHouseId = 'Птичник №1';
  producedTons = 3.0;
  operatorName = 'Ковалев Д. И.';

  submitProduction(): void {
    if (this.producedTons <= 0) return;

    this.feedService.produceFeedBatch({
      date: new Date().toISOString().split('T')[0],
      recipeCode: this.selectedRecipeCode,
      targetHouseId: this.targetHouseId,
      producedTons: Number(this.producedTons),
      operatorName: this.operatorName
    });
  }
}
