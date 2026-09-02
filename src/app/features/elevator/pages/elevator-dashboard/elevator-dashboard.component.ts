import { Component, inject, signal, model, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { GrainIntakeLog } from '../../interfaces/elevator.interface';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-elevator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './elevator-dashboard.component.html',
  styleUrl: './elevator-dashboard.component.css'
})
export class ElevatorDashboardComponent {
  protected readonly elevatorService = inject(ElevatorService);
  private readonly exportService = inject(ExportService);

  readonly silos = this.elevatorService.silos;
  readonly totalStoredTons = this.elevatorService.totalStoredTons;
  readonly totalCapacityTons = this.elevatorService.totalCapacityTons;
  readonly silosRequiringAttention = this.elevatorService.silosRequiringAttention;

  // Поля формы приёмки (через model() для корректной работы [(ngModel)])
  truckNumber = model('');
  culture = model('Кукуруза кормовая');
  weightTons = model<number | null>(null);
  moisturePercent = model<number | null>(null);
  selectedSiloId = model('silo-2');

  // Сигналы фильтрации весового журнала
  readonly searchQuery = model<string>('');
  readonly selectedCulture = model<string>('ALL');

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
    const truck = this.truckNumber();
    const weight = Number(this.weightTons());
    const moisture = Number(this.moisturePercent());
    const siloId = this.selectedSiloId();

    if (!truck || !weight || isNaN(weight) || isNaN(moisture)) {
      console.warn('Заполните все обязательные поля приёмки');
      return;
    }

    this.elevatorService.receiveGrain({
      truckNumber: truck,
      culture: this.culture(),
      weightTons: weight,
      moisturePercent: moisture,
      targetSiloId: siloId
    });

    // Очистка формы после успешной записи
    this.truckNumber.set('');
    this.weightTons.set(null);
    this.moisturePercent.set(null);
  }

  // Централизованный экспорт весового журнала в Excel
  exportToExcel(): void {
    const data = this.filteredLogs();
    if (data.length === 0) return;

    const headers = [
      'Время / Дата приёмки',
      'Гос. номер автотранспорта',
      'Культура / Сырьё',
      'Вес нетто (тонн)',
      'Влажность (%)',
      'Целевой силос / Бункер'
    ];

    const rows = data.map((l: GrainIntakeLog) => {
      const siloName = this.silos().find(s => s.id === l.targetSiloId)?.name || l.targetSiloId;
      return [
        l.date,
        l.truckNumber,
        l.culture,
        l.weightTons,
        l.moisturePercent,
        siloName
      ];
    });

    this.exportService.exportToCsv(headers, rows, 'Весовой_журнал_элеватора');
  }
}