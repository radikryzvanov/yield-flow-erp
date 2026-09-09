import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncubatorService } from '../../services/incubator.service';
import { IncubatorCabinet, IncubationLog } from '../../interfaces/incubator.interface';
import { PoultryManagementService } from '../../../poultry-management/services/poultry-management.service';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';

@Component({
  selector: 'app-incubator-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incubator-dashboard.component.html',
  styleUrl: './incubator-dashboard.component.css'
})
export class IncubatorDashboardComponent {
  protected readonly incubatorService = inject(IncubatorService);
  protected readonly poultryService = inject(PoultryManagementService);
  private readonly exportService = inject(ExportService);
  private readonly toastService = inject(ToastService);

  readonly cabinets = this.incubatorService.cabinets;
  readonly totalEggs = this.incubatorService.totalEggsInIncubation;
  readonly activeCabinets = this.incubatorService.activeCabinetsCount;
  readonly hatchForecast = this.incubatorService.averageHatchForecast;
  readonly expectedChicks = this.incubatorService.expectedChicksCount;
  readonly poultryHouses = this.poultryService.houses;

  // Сигналы фильтрации журнала
  readonly searchQuery = signal<string>('');
  readonly selectedCross = signal<string>('ALL');

  // Управление модальными окнами
  readonly isSetBatchModalOpen = signal<boolean>(false);
  readonly isCompleteHatchModalOpen = signal<boolean>(false);
  readonly activeCabinet = signal<IncubatorCabinet | null>(null);

  // Флаги сохранения для предотвращения задвоения
  readonly isSettingBatch = signal<boolean>(false);
  readonly isCompletingHatch = signal<boolean>(false);

  // Поля формы закладки партии
  batchNumberInput: string = '';
  crossTypeInput: string = 'Ломанн ЛСЛ Классик';
  eggsCountInput: number = 54000;
  expectedHatchRateInput: number = 88.0;

  // Поля формы завершения вывода
  chicksHatchedInput: number = 0;
  selectedHouseId: string = '';

  // Отфильтрованный журнал завершённых выводов
  readonly filteredLogs = computed(() => {
    const list = this.incubatorService.logs();
    const query = this.searchQuery().trim().toLowerCase();
    const cross = this.selectedCross();

    return list.filter((log: IncubationLog) => {
      const matchesSearch =
        query === '' ||
        log.batchNumber.toLowerCase().includes(query) ||
        log.destinationHouse.toLowerCase().includes(query) ||
        log.id.toLowerCase().includes(query);

      const matchesCross = cross === 'ALL' || log.crossType === cross;

      return matchesSearch && matchesCross;
    });
  });

  openSetBatchModal(cab: IncubatorCabinet): void {
    this.activeCabinet.set(cab);
    this.batchNumberInput = `ПАРТИЯ-ИЯ-${Date.now().toString().slice(-3)}`;
    this.crossTypeInput = 'Ломанн ЛСЛ Классик';
    this.eggsCountInput = 54000;
    this.expectedHatchRateInput = 88.0;
    this.isSetBatchModalOpen.set(true);
  }

  closeSetBatchModal(): void {
    this.isSetBatchModalOpen.set(false);
    this.activeCabinet.set(null);
  }

  submitSetBatch(): void {
    if (this.isSettingBatch()) return;

    const cab = this.activeCabinet();
    if (!cab) return;

    const count = Number(this.eggsCountInput);
    const expRate = Number(this.expectedHatchRateInput);

    if (!this.batchNumberInput.trim()) {
      this.toastService.show('Укажите номер партии инкубационного яйца.', 'error');
      return;
    }

    if (isNaN(count) || count <= 0) {
      this.toastService.show('Количество закладываемого яйца должно быть больше 0.', 'error');
      return;
    }

    if (isNaN(expRate) || expRate < 10 || expRate > 100) {
      this.toastService.show('Плановый вывод должен быть в диапазоне от 10% до 100%.', 'error');
      return;
    }

    this.isSettingBatch.set(true);
    try {
      const success = this.incubatorService.setBatch({
        cabinetId: cab.id,
        batchNumber: this.batchNumberInput.trim(),
        crossType: this.crossTypeInput,
        eggsCount: count,
        expectedHatchRatePercent: expRate
      });

      if (success) {
        this.toastService.show(`Партия «${this.batchNumberInput.trim()}» заложена в «${cab.name}».`);
        this.closeSetBatchModal();
      } else {
        this.toastService.show('Ошибка при закладке партии в шкаф.', 'error');
      }
    } finally {
      this.isSettingBatch.set(false);
    }
  }

  openCompleteHatchModal(cab: IncubatorCabinet): void {
    this.activeCabinet.set(cab);
    this.chicksHatchedInput = Math.round(cab.eggsCount * (cab.expectedHatchRatePercent / 100));
    const defaultHouse = this.poultryHouses().find(h => h.birdType === 'rearing' || h.birdType === 'broiler');
    this.selectedHouseId = defaultHouse ? defaultHouse.id : (this.poultryHouses()[0]?.id ?? '');
    this.isCompleteHatchModalOpen.set(true);
  }

  closeCompleteHatchModal(): void {
    this.isCompleteHatchModalOpen.set(false);
    this.activeCabinet.set(null);
  }

  submitCompleteHatch(): void {
    if (this.isCompletingHatch()) return;

    const cab = this.activeCabinet();
    if (!cab) return;

    const hatched = Number(this.chicksHatchedInput);
    if (isNaN(hatched) || hatched <= 0) {
      this.toastService.show('Укажите корректное количество выведенных цыплят больше нуля.', 'error');
      return;
    }

    if (hatched > cab.eggsCount) {
      this.toastService.show(`Выведено цыплят (${hatched}) не может быть больше, чем заложено яиц (${cab.eggsCount})!`, 'error');
      return;
    }

    this.isCompletingHatch.set(true);
    try {
      const house = this.poultryHouses().find(h => h.id === this.selectedHouseId);
      const houseName = house ? house.name : 'Ремонтный блок';

      const success = this.incubatorService.completeHatch({
        cabinetId: cab.id,
        chicksHatched: hatched,
        destinationHouse: houseName
      });

      if (success) {
        if (this.selectedHouseId) {
          this.poultryService.receiveNewFlock(this.selectedHouseId, hatched);
        }
        this.toastService.show(`Вывод зафиксирован: ${hatched} гол. переведены в «${houseName}».`);
        this.closeCompleteHatchModal();
      } else {
        this.toastService.show('Не удалось зафиксировать вывод цыплят.', 'error');
      }
    } finally {
      this.isCompletingHatch.set(false);
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'incubation': return 'Инкубация';
      case 'candling': return 'Миражирование / Перенос';
      case 'hatching': return 'Вывод цыплят';
      case 'sanitization': return 'Санобработка (Мойка)';
      default: return status;
    }
  }

  exportToExcel(): void {
    const data = this.filteredLogs();
    if (data.length === 0) return;

    const headers = [
      '№ Вывода',
      'Дата завершения',
      'Партия ИЯ',
      'Кросс птицы',
      'Заложено яиц (шт)',
      'Выведено цыплят (гол)',
      'Фактический вывод (%)',
      'Корпус назначения'
    ];

    const rows = data.map((log: IncubationLog) => [
      log.id,
      log.date,
      log.batchNumber,
      log.crossType,
      log.eggsSet,
      log.chicksHatched,
      log.actualHatchRate,
      log.destinationHouse
    ]);

    this.exportService.exportToCsv(headers, rows, 'Журнал_вывода_цыплят');
  }
}