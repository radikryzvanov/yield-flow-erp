import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElevatorService } from '../../services/elevator.service';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';
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
  private readonly exportService = inject(ExportService);
  private readonly toastService = inject(ToastService);

  readonly silos = this.elevatorService.silos;
  readonly intakeLogs = this.elevatorService.intakeLogs;
  readonly totalCapacity = this.elevatorService.totalCapacityTons;

  // Реальные computed-сигналы из сервиса элеватора
  readonly currentStock = computed(() =>
    this.silos().reduce((sum, s) => sum + s.currentTons, 0)
  );

  readonly activeSilosCount = computed(() =>
    this.silos().filter(s => s.currentTons > 0).length
  );

  readonly avgMoisture = computed(() => {
    const active = this.silos().filter(s => s.currentTons > 0);
    if (active.length === 0) return 14.0;
    const total = active.reduce((sum, s) => sum + s.moisturePercent, 0);
    return Math.round((total / active.length) * 10) / 10;
  });

  // Поля формы приёмки зерна
  truckNumber = signal<string>('У 704 КТ 73');
  culture = signal<string>('Пшеница фуражная 4 класс');
  weightTons = signal<number | null>(28.5);
  moisturePercent = signal<number | null>(13.8);
  selectedSiloId = signal<string>('silo-1');
  readonly isSaving = signal<boolean>(false);

  submitIntake(): void {
    if (this.isSaving()) return;

    const truck = this.truckNumber().trim();
    const weight = Number(this.weightTons());
    const moisture = Number(this.moisturePercent());
    const siloId = this.selectedSiloId();
    const selectedCultureValue = this.culture();

    if (!truck) {
      this.toastService.show('Укажите госномер автомобиля-зерновоза.', 'error');
      return;
    }

    if (isNaN(weight) || weight <= 0) {
      this.toastService.show('Вес зерна должен быть числом больше 0.', 'error');
      return;
    }

    if (isNaN(moisture) || moisture < 5 || moisture > 35) {
      this.toastService.show('Влажность зерна должна быть в технологическом диапазоне 5–35%.', 'error');
      return;
    }

    const targetSilo = this.silos().find(s => s.id === siloId);
    if (targetSilo && targetSilo.culture !== selectedCultureValue) {
      const confirmed = confirm(
        `Внимание: в силосе «${targetSilo.name}» сейчас хранится «${targetSilo.culture}», а вы принимаете «${selectedCultureValue}». Продолжить приёмку в этот силос?`
      );
      if (!confirmed) return;
    }

    this.isSaving.set(true);
    try {
      const result = this.elevatorService.receiveGrain({
        truckNumber: truck,
        culture: selectedCultureValue,
        weightTons: weight,
        moisturePercent: moisture,
        targetSiloId: siloId
      });

      if (result.overflow > 0) {
        this.toastService.show(`Внимание: силос заполнен. Принято ${result.accepted} т из ${weight} т, излишек ${result.overflow} т не размещён!`, 'error');
      } else {
        this.toastService.show(`Партия зерна (${result.accepted} т) успешно принята в «${targetSilo?.name ?? siloId}».`);
      }

      this.weightTons.set(null);
    } finally {
      this.isSaving.set(false);
    }
  }

  exportToExcel(): void {
    const data = this.intakeLogs();
    if (data.length === 0) return;

    const headers = [
      'Дата / Время',
      'Транспорт (Авто)',
      'Культура / Сырьё',
      'Вес партии (т)',
      'Влажность (%)',
      'Целевой силос'
    ];

    const rows = data.map((l: GrainIntakeLog) => [
      l.date,
      l.truckNumber,
      l.culture,
      l.weightTons,
      `${l.moisturePercent}%`,
      l.targetSiloId
    ]);

    this.exportService.exportToCsv(headers, rows, 'Журнал_приемки_зерна_Элеватор');
  }
}