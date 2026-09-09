import { Injectable, computed, inject } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';
import { EggWarehouseService } from '../../poultry-management/services/egg-warehouse.service';
import { FeedWarehouseService } from '../../feed-warehouse/services/feed-warehouse.service';
import { PoultryManagementService } from '../../poultry-management/services/poultry-management.service';
import { CostBreakdownItem } from '../interfaces/finance.interface';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly eggWarehouse = inject(EggWarehouseService);
  private readonly feedWarehouse = inject(FeedWarehouseService);
  private readonly poultryService = inject(PoultryManagementService);

  // Прейскурант цен на яйцо (руб / шт)
  private readonly _eggPrices = persistedSignal<Record<string, number>>('yieldflow_finance_egg_prices', {
    'СВ': 11.5,
    'С0': 9.8,
    'С1': 8.5,
    'С2': 7.2,
    'Грязь/Насечка': 5.0
  });

  // Стоимость корма (руб / кг)
  private readonly _feedCostPerKg = persistedSignal<number>('yieldflow_finance_feed_cost_kg', 28.5);

  // Накладные расходы в сутки (руб)
  private readonly _dailyOverheadCosts = persistedSignal<number>('yieldflow_finance_daily_overhead', 220000);

  readonly eggPrices = this._eggPrices.asReadonly();
  readonly feedCostPerKg = this._feedCostPerKg.asReadonly();
  readonly dailyOverheadCosts = this._dailyOverheadCosts.asReadonly();

  // Суточная выручка от реализации яйца
  readonly dailyRevenueRub = computed(() => {
    const prices = this._eggPrices();
    const stocks = this.eggWarehouse.stocks();
    const totalDailyEggs = this.poultryService.totalDailyEggs();

    if (!stocks || stocks.length === 0 || totalDailyEggs <= 0) {
      return 0;
    }

    const totalStock = stocks.reduce((sum, s) => sum + s.count, 0);

    return Math.round(
      stocks.reduce((sum, s) => {
        const share = totalStock > 0 ? s.count / totalStock : 0.2;
        const dailyCategoryEggs = totalDailyEggs * share;
        const price = prices[s.category] ?? 8.0;
        return sum + dailyCategoryEggs * price;
      }, 0)
    );
  });

  // Суточные прямые затраты на кормление
  readonly dailyFeedCostRub = computed(() => {
    const totalFeedTons = this.poultryService.totalDailyFeedTons();
    const costPerKg = this._feedCostPerKg();
    return Math.round(totalFeedTons * 1000 * costPerKg);
  });

  // Суточные совокупные расходы (корма + накладные)
  readonly totalDailyExpensesRub = computed(() => {
    return this.dailyFeedCostRub() + this._dailyOverheadCosts();
  });

  // Чистая суточная прибыль фабрики
  readonly dailyProfitRub = computed(() => {
    return this.dailyRevenueRub() - this.totalDailyExpensesRub();
  });

  // Себестоимость одного столового яйца
  readonly costPerEggRub = computed(() => {
    const totalEggs = this.poultryService.totalDailyEggs();
    if (totalEggs <= 0) return 0;
    return Math.round((this.totalDailyExpensesRub() / totalEggs) * 100) / 100;
  });

  // Структура затрат для графика и калькуляции
  readonly costBreakdown = computed<CostBreakdownItem[]>(() => {
    const feed = this.dailyFeedCostRub();
    const overhead = this._dailyOverheadCosts();
    const total = feed + overhead;

    if (total === 0) return [];

    const feedShare = Math.round((feed / total) * 1000) / 10;
    const overheadShare = Math.round((overhead / total) * 1000) / 10;

    return [
      {
        category: 'Корма и рационы (ПК)',
        amountRub: feed,
        sharePercent: feedShare,
        color: '#f59e0b'
      },
      {
        category: 'Накладные расходы (ЗП, энергетика, амортизация)',
        amountRub: overhead,
        sharePercent: overheadShare,
        color: '#3b82f6'
      }
    ];
  });

  updateEggPrice(category: string, price: number): void {
    const validPrice = isNaN(price) || price < 0 ? 0 : price;
    this._eggPrices.update(current => ({
      ...current,
      [category]: validPrice
    }));
  }

  updateFeedCostPerKg(cost: number): void {
    const validCost = isNaN(cost) || cost < 0 ? 0 : cost;
    this._feedCostPerKg.set(validCost);
  }

  updateOverheadCosts(costs: number): void {
    const validCosts = isNaN(costs) || costs < 0 ? 0 : costs;
    this._dailyOverheadCosts.set(validCosts);
  }
}