import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VeterinaryService } from '../../services/veterinary.service';

@Component({
  selector: 'app-veterinary-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './veterinary-dashboard.component.html',
  styleUrls: ['./veterinary-dashboard.component.css']
})
export class VeterinaryDashboardComponent {
  protected readonly vetService = inject(VeterinaryService);

  readonly schedule = this.vetService.schedule;
  readonly stock = this.vetService.stock;
  readonly logs = this.vetService.logs;
  readonly pendingVaccinations = this.vetService.pendingVaccinationsCount;
  readonly totalMortality = this.vetService.totalDailyMortality;
  readonly livability = this.vetService.flockLivabilityPercent;

  getMethodBadge(method: string): string {
    switch (method) {
      case 'water': return '💧 Выпойка с водой';
      case 'spray': return '💨 Аэрозольно (спрей)';
      case 'injection': return '💉 Инъекция';
      case 'in-ovo': return '🥚 In-ovo (в яйцо)';
      default: return method;
    }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'completed': return 'Выполнено';
      case 'urgent': return 'Требует внимания';
      case 'pending': return 'Запланировано';
      default: return status;
    }
  }
}