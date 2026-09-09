import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../services/finance.service';
import { PoultryManagementService } from '../../../poultry-management/services/poultry-management.service';
import { ExportService } from '../../../../shared/services/export.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { CostBreakdownItem } from '../../interfaces/finance.interface';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-dashboard.component.html',
  styleUrl: './finance-dashboard.component.css'
})
export class FinanceDashboardComponent {
  protected readonly financeService = inject(FinanceService);
  private readonly poultryService = inject(PoultryManagementService);
  private readonly exportService = inject(ExportService);
  private readonly toastService = inject(ToastService);

  readonly dailyRevenue = this.financeService.dailyRevenueRub;
  readonly dailyFeedCost = this.financeService.dailyFeedCostRub;
  readonly dailyOverhead = this.financeService.dailyOverheadCosts;
  readonly dailyProfit = this.financeService.dailyProfitRub;
  readonly costPerEgg = this.financeService.costPerEggRub;
  readonly costBreakdown = this.financeService.costBreakdown;
  readonly eggPrices = this.financeService.eggPrices;
  readonly feedCostPerKg = this.financeService.feedCostPerKg;

  readonly avgPricePerEgg = computed(() => {
    const totalEggs = this.poultryService.totalDailyEggs();
    const revenue = this.dailyRevenue();
    if (!totalEggs || totalEggs <= 0) return 8.5;
    return Math.round((revenue / totalEggs) * 100) / 100;
  });

  // Локальные поля формы прейскуранта и затрат
  priceCB: number = 11.5;
  priceC0: number = 9.8;
  priceC1: number = 8.5;
  priceC2: number = 7.2;
  priceDirty: number = 5.0;
  feedCostInput: number = 28.5;
  overheadInput: number = 220000;
  readonly isSavingSettings = signal<boolean>(false);

  constructor() {
    const prices = this.eggPrices();
    if (prices) {
      this.priceCB = prices['СВ'] ?? 11.5;
      this.priceC0 = prices['С0'] ?? 9.8;
      this.priceC1 = prices['С1'] ?? 8.5;
      this.priceC2 = prices['С2'] ?? 7.2;
      this.priceDirty = prices['Грязь/Насечка'] ?? 5.0;
    }
    this.feedCostInput = this.feedCostPerKg() ?? 28.5;
    this.overheadInput = this.dailyOverhead() ?? 220000;
  }

  saveFinancialSettings(): void {
    if (this.isSavingSettings()) return;

    const cb = Number(this.priceCB);
    const c0 = Number(this.priceC0);
    const c1 = Number(this.priceC1);
    const c2 = Number(this.priceC2);
    const dirty = Number(this.priceDirty);
    const feed = Number(this.feedCostInput);
    const overhead = Number(this.overheadInput);

    if (
      isNaN(cb) || cb < 0 ||
      isNaN(c0) || c0 < 0 ||
      isNaN(c1) || c1 < 0 ||
      isNaN(c2) || c2 < 0 ||
      isNaN(dirty) || dirty < 0 ||
      isNaN(feed) || feed < 0 ||
      isNaN(overhead) || overhead < 0
    ) {
      this.toastService.show('Цены и статьи затрат не могут быть отрицательными или пустыми!', 'error');
      return;
    }

    this.isSavingSettings.set(true);
    try {
      this.financeService.updateEggPrice('СВ', cb);
      this.financeService.updateEggPrice('С0', c0);
      this.financeService.updateEggPrice('С1', c1);
      this.financeService.updateEggPrice('С2', c2);
      this.financeService.updateEggPrice('Грязь/Насечка', dirty);
      this.financeService.updateFeedCostPerKg(feed);
      this.financeService.updateOverheadCosts(overhead);

      this.toastService.show('Прейскурант цен и накладные расходы успешно сохранены!');
    } catch {
      this.toastService.show('Произошла ошибка при сохранении настроек.', 'error');
    } finally {
      this.isSavingSettings.set(false);
    }
  }

  exportToExcel(): void {
    const data = this.costBreakdown();
    if (data.length === 0) return;

    const headers = [
      'Статья калькуляции затрат',
      'Сумма за сутки (руб.)',
      'Доля в структуре себестоимости (%)'
    ];

    const rows = data.map((item: CostBreakdownItem) => [
      item.category,
      item.amountRub,
      `${item.sharePercent}%`
    ]);

    this.exportService.exportToCsv(headers, rows, 'Калькуляция_себестоимости_YieldFlow');
  }
}