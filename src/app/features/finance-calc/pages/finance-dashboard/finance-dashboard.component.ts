import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finance-dashboard.component.html',
  styleUrl: './finance-dashboard.component.css'
})
export class FinanceDashboardComponent {
  protected readonly financeService = inject(FinanceService);

  readonly dailyRevenue = this.financeService.dailyRevenueRub;
  readonly dailyProfit = this.financeService.dailyProfitRub;
  readonly costPerEgg = this.financeService.costPerEggRub;
  readonly profitability = this.financeService.profitabilityPercent;
  readonly dailyFeedCost = this.financeService.dailyFeedCostRub;
  readonly costBreakdown = this.financeService.costBreakdown;
  readonly totalEggs = this.financeService.totalDailyEggs;
  readonly feedTons = this.financeService.dailyFeedTons;
}