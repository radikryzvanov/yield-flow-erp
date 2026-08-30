import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncubatorService } from '../../services/incubator.service';

@Component({
  selector: 'app-incubator-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './incubator-dashboard.component.html',
  styleUrl: './incubator-dashboard.component.css'
})
export class IncubatorDashboardComponent {
  protected readonly incubatorService = inject(IncubatorService);

  readonly cabinets = this.incubatorService.cabinets;
  readonly logs = this.incubatorService.logs;
  readonly totalEggs = this.incubatorService.totalEggsInIncubation;
  readonly activeCabinets = this.incubatorService.activeCabinetsCount;
  readonly hatchForecast = this.incubatorService.averageHatchForecast;
  readonly expectedChicks = this.incubatorService.expectedChicksCount;

  getStatusLabel(status: string): string {
    switch (status) {
      case 'incubation': return 'Инкубация';
      case 'candling': return 'Миражирование / Перенос';
      case 'hatching': return 'Вывод цыплят';
      case 'sanitization': return 'Санобработка (Мойка)';
      default: return status;
    }
  }
}