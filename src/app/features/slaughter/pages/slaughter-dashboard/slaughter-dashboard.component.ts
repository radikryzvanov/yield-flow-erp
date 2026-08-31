import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlaughterService } from '../../services/slaughter.service';

@Component({
  selector: 'app-slaughter-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slaughter-dashboard.component.html',
  styleUrl: './slaughter-dashboard.component.css'
})
export class SlaughterDashboardComponent {
  protected readonly slaughterService = inject(SlaughterService);

  readonly lines = this.slaughterService.lines;
  readonly products = this.slaughterService.products;
  readonly logs = this.slaughterService.logs;
  readonly totalLiveWeight = this.slaughterService.totalLiveWeightTodayTons;
  readonly totalMeatYield = this.slaughterService.totalMeatYieldKg;
  readonly slaughterRevenue = this.slaughterService.totalSlaughterRevenueRub;
  readonly avgYieldPercent = this.slaughterService.averageYieldPercent;
}