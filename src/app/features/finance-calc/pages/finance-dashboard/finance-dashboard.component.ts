import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, EggPriceMap } from '../../services/finance.service';
import { ExportService } from '../../../../shared/services/export.service';

@Component({
  selector: 'app-finance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finance-dashboard.component.html',
  styleUrl: './finance-dashboard.component.css'
})
export class FinanceDashboardComponent {
  protected readonly financeService = inject(FinanceService);
  private readonly exportService = inject(ExportService);

  readonly dailyRevenue = this.financeService.dailyRevenueRub;
  readonly dailyProfit = this.financeService.dailyProfitRub;
  readonly costPerEgg = this.financeService.costPerEggRub;
  readonly profitability = this.financeService.profitabilityPercent;
  readonly dailyFeedCost = this.financeService.dailyFeedCostRub;
  readonly costBreakdown = this.financeService.costBreakdown;
  readonly totalEggs = this.financeService.totalDailyEggs;
  readonly feedTons = this.financeService.dailyFeedTons;

  readonly eggPrices = this.financeService.eggPrices;
  readonly feedCostPerKg = this.financeService.feedCostPerKg;
  readonly dailyOverheadCostsRub = this.financeService.dailyOverheadCostsRub;

  // Управление модальным окном настроек
  readonly isSettingsModalOpen = signal<boolean>(false);

  // Локальные поля формы настроек
  editableFeedCost: number = 0;
  editableOverheads: number = 0;
  editablePrices: { category: string; price: number }[] = [];

  openSettingsModal(): void {
    this.editableFeedCost = this.feedCostPerKg();
    this.editableOverheads = this.dailyOverheadCostsRub();
    const currentPrices = this.eggPrices();
    this.editablePrices = Object.keys(currentPrices).map(cat => ({
      category: cat,
      price: currentPrices[cat]
    }));
    this.isSettingsModalOpen.set(true);
  }

  closeSettingsModal(): void {
    this.isSettingsModalOpen.set(false);
  }

  saveSettings(): void {
    if (this.editableFeedCost > 0) {
      this.financeService.updateFeedCostPerKg(this.editableFeedCost);
    }
    if (this.editableOverheads >= 0) {
      this.financeService.updateOverheadCosts(this.editableOverheads);
    }
    for (const item of this.editablePrices) {
      if (item.price > 0) {
        this.financeService.updateEggPrice(item.category, item.price);
      }
    }
    this.closeSettingsModal();
  }

  // Централизованный экспорт финансово-экономического отчета
  exportToExcel(): void {
    const headers = [
      'Статья затрат / Показатель',
      'Сумма (₽ / сут)',
      'Доля в себестоимости (%)',
      'Примечание / Бенчмарк'
    ];

    // Выгружаем расшифровку затрат
    const rows: (string | number)[][] = this.costBreakdown().map(item => [
      item.category,
      item.amountRub,
      item.sharePercent,
      'Производственные расходы'
    ]);

    // Добавляем ключевые сводные строки P&L
    rows.push(
      ['---', '---', '---', '---'],
      ['Суточная выручка', this.dailyRevenue(), 100, `При сборе ${this.totalEggs()} шт/сут`],
      ['Чистая суточная прибыль', this.dailyProfit(), '-', `Рентабельность ${this.profitability()}%`],
      ['Себестоимость 1 яйца (₽)', this.costPerEgg(), '-', 'Корма + Накладные расходы'],
      ['Затраты на корма (₽)', this.dailyFeedCost(), '-', `Расход: ${this.feedTons()} т комбикорма`],
      ['Прогноз месячной EBITDA (₽)', Math.round(this.dailyProfit() * 30.5), '-', 'Операционная прибыль за 30.5 дней']
    );

    this.exportService.exportToCsv(headers, rows, 'Финансово_экономический_отчет_Директорат');
  }
}