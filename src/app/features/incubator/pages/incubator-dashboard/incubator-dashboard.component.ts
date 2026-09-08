import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncubatorService } from '../../services/incubator.service';
import { IncubatorCabinet, IncubationLog } from '../../interfaces/incubator.interface';
import { PoultryManagementService } from '../../../poultry-management/services/poultry-management.service';
import { ExportService } from '../../../../shared/services/export.service';

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
    const cab = this.activeCabinet();
    if (!cab) return;

    if (!this.batchNumberInput.trim() || !this.eggsCountInput || this.eggsCountInput <= 0) {
      alert('Заполните корректный номер партии и количество яиц.');
      return;
    }

    const success = this.incubatorService.setBatch({
      cabinetId: cab.id,
      batchNumber: this.batchNumberInput.trim(),
      crossType: this.crossTypeInput,
      eggsCount: Number(this.eggsCountInput),
      expectedHatchRatePercent: Number(this.expectedHatchRateInput)
    });

    if (success) {
      this.closeSetBatchModal();
    } else {
      alert('Ошибка при закладке партии в шкаф.');
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
    const cab = this.activeCabinet();
    if (!cab) return;

    const hatched = Number(this.chicksHatchedInput);
    if (isNaN(hatched) || hatched <= 0) {
      alert('Укажите корректное количество выведенных цыплят.');
      return;
    }

    if (hatched > cab.eggsCount) {
      alert(`Ошибка: количество цыплят (${hatched}) не может превышать закладку яиц (${cab.eggsCount}).`);
      return;
    }

    const house = this.poultryHouses().find(h => h.id === this.selectedHouseId);
    const houseName = house ? house.name : 'Ремонтный блок';

    const success = this.incubatorService.completeHatch({
      cabinetId: cab.id,
      chicksHatched: hatched,
      destinationHouse: houseName
    });

    if (success) {
      // С1: автоматическое пополнение поголовья целевого птичника
      if (this.selectedHouseId) {
        this.poultryService.receiveNewFlock(this.selectedHouseId, hatched);
      }
      this.closeCompleteHatchModal();
    } else {
      alert('Не удалось зафиксировать вывод цыплят.');
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

  // Централизованный экспорт журнала вывода в Excel
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