import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoultryManagementService } from '../../services/poultry-management.service';

@Component({
  selector: 'app-poultry-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poultry-list.component.html',
  styleUrl: './poultry-list.component.css'
})
export class PoultryListComponent {
  protected readonly poultryService = inject(PoultryManagementService);

  readonly houses = this.poultryService.houses;
  readonly totalBirds = this.poultryService.totalBirds;
  readonly totalDailyEggs = this.poultryService.totalDailyEggs;
  readonly totalDailyFeedTons = this.poultryService.totalDailyFeedTons;
  readonly averageLayingRate = this.poultryService.averageLayingRate;

  getAgeWeeks(days: number): number {
    return Math.floor(days / 7);
  }

  isTemperatureNormal(actual: number, target: number): boolean {
    return Math.abs(actual - target) <= 1.0;
  }
}