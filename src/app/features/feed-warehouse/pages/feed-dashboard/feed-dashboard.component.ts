import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedWarehouseService } from '../../services/feed-warehouse.service';

@Component({
  selector: 'app-feed-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './feed-dashboard.component.html',
  styleUrl: './feed-dashboard.component.css'
})
export class FeedDashboardComponent {
  protected readonly feedService = inject(FeedWarehouseService);

  readonly bunkers = this.feedService.bunkers;
  readonly recipes = this.feedService.recipes;
  readonly movementLogs = this.feedService.movementLogs;
  readonly totalStockTons = this.feedService.totalStockTons;
  readonly dailyConsumptionTons = this.feedService.dailyConsumptionTons;
  readonly daysOfSupply = this.feedService.daysOfSupply;
}