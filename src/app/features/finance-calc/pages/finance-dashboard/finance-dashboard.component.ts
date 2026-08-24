import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-dashboard.component.html',
  styleUrl: './finance-dashboard.component.css'
})
export class FinanceDashboardComponent {
  protected readonly financeService = inject(FinanceService);

  readonly batchSummaries = this.financeService.batchSummaries;
  readonly totalRevenue = this.financeService.totalRevenue;
  readonly totalCost = this.financeService.totalCost;
  readonly totalNetProfit = this.financeService.totalNetProfit;
  readonly averageFcr = this.financeService.averageFcr;

  forecastForm = {
    headsCount: 25000,
    targetWeightKg: 2.6,
    expectedFcr: 1.62,
    feedPricePerKg: 35,
    chickPricePerHead: 45,
    vetAndOtherPerHead: 27,
    sellingPricePerKg: 125
  };

  forecastResult = signal(this.financeService.calculateForecast(this.forecastForm));

  recalculate(): void {
    this.forecastResult.set(this.financeService.calculateForecast(this.forecastForm));
  }
}