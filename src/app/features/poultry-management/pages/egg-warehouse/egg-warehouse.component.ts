import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EggWarehouseService, ReceiveEggPayload } from '../../services/egg-warehouse.service';

@Component({
  selector: 'app-egg-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './egg-warehouse.component.html',
  styleUrl: './egg-warehouse.component.css'
})
export class EggWarehouseComponent {
  protected readonly eggService = inject(EggWarehouseService);

  readonly categories = this.eggService.categories;
  readonly incomingLogs = this.eggService.incomingLogs;
  readonly totalEggsInStock = this.eggService.totalEggsInStock;
  readonly todaySortedCount = this.eggService.todaySortedCount;
  readonly rejectPercent = this.eggService.rejectPercent;

  receiveForm: ReceiveEggPayload = {
    houseName: 'Птичник № 1',
    totalCount: 45000,
    damagedCount: 450
  };

  onReceive(): void {
    const count = Number(this.receiveForm.totalCount);
    const damaged = Number(this.receiveForm.damagedCount) || 0;

    if (!this.receiveForm.houseName || count <= 0) {
      return;
    }

    this.eggService.receiveEggs({
      houseName: this.receiveForm.houseName,
      totalCount: count,
      damagedCount: damaged
    });

    this.receiveForm = {
      houseName: 'Птичник № 1',
      totalCount: 10000,
      damagedCount: 0
    };
  }
}