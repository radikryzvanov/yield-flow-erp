import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { GrainIntakeLog } from '../../interfaces/elevator.interface';

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
  readonly totalStoredTons = this.elevatorService.totalStoredTons;
  readonly totalCapacityTons = this.elevatorService.totalCapacityTons;
  readonly silosRequiringAttention = this.elevatorService.silosRequiringAttention;

  // Форма приемки
  truckNumber = signal('');
  culture = signal('Пшеница фуражная (5 класс)');
  weightTons = signal<number | null>(null);
  moisturePercent = signal<number | null>(null);
  selectedSiloId = signal('silo-1');

  // Сигналы фильтрации весового журнала
  readonly searchQuery = signal<string>('');
  readonly selectedCulture = signal<string>('ALL');

  readonly filteredLogs = computed(() => {
    const list = this.elevatorService.intakeLogs();
    const query = this.searchQuery().trim().toLowerCase();
    const cult = this.selectedCulture();

    return list.filter((log: GrainIntakeLog) => {
      const matchesSearch =
        query === '' ||
        log.truckNumber.toLowerCase().includes(query) ||
        log.date.toLowerCase().includes(query);

      const matchesCulture = cult === 'ALL' || log.culture === cult;

      return matchesSearch && matchesCulture;
    });
  });

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

  // Экспорт весового журнала зерна в Excel (.csv UTF-8 BOM)
  exportToExcel(): void {
    const data = this.filteredLogs();
    if (data.length === 0) return;

    const headers = ['Время/Дата', 'Гос. номер машины', 'Культура / Сырьё', 'Вес нетто (тонн)', 'Влажность (%)', 'Целевой силос'];
    const rows = data.map((l: GrainIntakeLog) => {
      const siloName = this.silos().find(s => s.id === l.targetSiloId)?.name || l.targetSiloId;
      return [
        `"${l.date}"`,
        `"${l.truckNumber}"`,
        `"${l.culture}"`,
        l.weightTons.toString().replace('.', ','),
        l.moisturePercent.toString().replace('.', ','),
        `"${siloName}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Весовой_журнал_элеватора_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}