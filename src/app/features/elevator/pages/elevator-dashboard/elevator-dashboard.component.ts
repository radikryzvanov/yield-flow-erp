import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';

@Component({
  selector: 'app-elevator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './elevator-dashboard.component.html',
  styleUrl: './elevator-dashboard.component.css'
})
export class ElevatorDashboardComponent {
  protected readonly elevatorService = inject(ElevatorService);

  readonly silos = this.elevatorService.silos;
  readonly intakeLogs = this.elevatorService.intakeLogs;
  readonly totalStoredTons = this.elevatorService.totalStoredTons;
  readonly totalCapacityTons = this.elevatorService.totalCapacityTons;
  readonly silosRequiringAttention = this.elevatorService.silosRequiringAttention;

  truckNumber = signal('');
  culture = signal('Пшеница фуражная (5 класс)');
  weightTons = signal<number | null>(null);
  moisturePercent = signal<number | null>(null);
  selectedSiloId = signal('silo-1');

  submitIntake(): void {
    if (!this.truckNumber() || !this.weightTons() || !this.moisturePercent()) return;

    this.elevatorService.receiveGrain({
      truckNumber: this.truckNumber(),
      culture: this.culture(),
      weightTons: this.weightTons()!,
      moisturePercent: this.moisturePercent()!,
      targetSiloId: this.selectedSiloId()
    });

    this.truckNumber.set('');
    this.weightTons.set(null);
    this.moisturePercent.set(null);
  }
}