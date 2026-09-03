import { Injectable, computed, inject } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';
import { PoultryManagementService } from '../../poultry-management/services/poultry-management.service';
import { CostBreakdownItem } from '../interfaces/finance.interface';

export interface EggPriceMap {
  [category: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly poultryService = inject(PoultryManagementService);

  // Оптовый прейскурант реализации яйца (за десяток в рублях)
  readonly eggPrices = persistedSignal<EggPriceMap>('yieldflow_finance_egg_prices', {
    'СВ': 115,
    'С0': 95,
    'С1': 82,
    'С2': 68,
    'Грязь/Насечка': 35
  });

  // Себестоимость комбикорма за 1 кг
  readonly feedCostPerKg = persistedSignal<number>('yieldflow_finance_feed_cost_kg', 22.50);

  // Суточные постоянные накладные расходы (ФОТ, энергетика, амортизация, ветеринария)
  readonly dailyOverheadCostsRub = persistedSignal<number>('yieldflow_finance_overhead_rub', 450_000);

  // Сбор оперативных данных напрямую из птичников (реактивная сквозная связка)
  readonly totalDailyEggs = computed(() => this.poultryService.totalDailyEggs());
  readonly dailyFeedTons = computed(() => this.poultryService.totalDailyFeedTons());

  // Расчёт затрат на корма за сутки
  readonly dailyFeedCostRub = computed(() => {
    return Math.round(this.dailyFeedTons() * 1000 * this.feedCostPerKg());
  });

  // Расчёт суточной выручки с учётом категорийности и прейскуранта
  readonly dailyRevenueRub = computed(() => {
    const totalEggs = this.totalDailyEggs();
    if (totalEggs === 0) return 0;

    const prices = this.eggPrices();
    const pC0 = prices['С0'] ?? 95;
    const pC1 = prices['С1'] ?? 82;
    const pC2 = prices['С2'] ?? 68;
    const pWaste = prices['Грязь/Насечка'] ?? 35;

    const revC0 = (totalEggs * 0.30 * pC0) / 10;
    const revC1 = (totalEggs * 0.55 * pC1) / 10;
    const revC2 = (totalEggs * 0.12 * pC2) / 10;
    const revWaste = (totalEggs * 0.03 * pWaste) / 10;

    return Math.round(revC0 + revC1 + revC2 + revWaste);
  });

  // Производственная себестоимость одного яйца (руб/шт)
  readonly costPerEggRub = computed(() => {
    const totalEggs = this.totalDailyEggs();
    if (totalEggs === 0) return 0;
    const totalDailyCosts = this.dailyFeedCostRub() + this.dailyOverheadCostsRub();
    return Math.round((totalDailyCosts / totalEggs) * 100) / 100;
  });

  // Чистая суточная прибыль фабрики
  readonly dailyProfitRub = computed(() => {
    return this.dailyRevenueRub() - (this.dailyFeedCostRub() + this.dailyOverheadCostsRub());
  });

  // Рентабельность производства (%)
  readonly profitabilityPercent = computed(() => {
    const revenue = this.dailyRevenueRub();
    if (revenue === 0) return 0;
    return Math.round((this.dailyProfitRub() / revenue) * 1000) / 10;
  });

  // Структура операционных затрат предприятия
  readonly costBreakdown = computed<CostBreakdownItem[]>(() => {
    const feed = this.dailyFeedCostRub();
    const fot = 210_000;
    const energy = 120_000;
    const vet = 70_000;
    const other = 50_000;
    const total = feed + fot + energy + vet + other;

    if (total === 0) return [];

    return [
      { category: 'Комбикорма и рационы', amountRub: feed, sharePercent: Math.round((feed / total) * 100), color: '#d97706' },
      { category: 'Фонд оплаты труда (ФОТ)', amountRub: fot, sharePercent: Math.round((fot / total) * 100), color: '#2563eb' },
      { category: 'Энергоресурсы (Газ, Свет)', amountRub: energy, sharePercent: Math.round((energy / total) * 100), color: '#dc2626' },
      { category: 'Ветеринария и биозащита', amountRub: vet, sharePercent: Math.round((vet / total) * 100), color: '#16a34a' },
      { category: 'Амортизация и логистика', amountRub: other, sharePercent: Math.round((other / total) * 100), color: '#64748b' }
    ];
  });

  // Обновление цены на категорию яйца в прейскуранте
  updateEggPrice(category: string, pricePerTenRub: number): void {
    const price = Number(pricePerTenRub);
    if (isNaN(price) || price <= 0) return;

    this.eggPrices.update(prices => ({
      ...prices,
      [category]: price
    }));
  }

  // Корректировка себестоимости корма
  updateFeedCostPerKg(costRub: number): void {
    const cost = Number(costRub);
    if (isNaN(cost) || cost <= 0) return;
    this.feedCostPerKg.set(cost);
  }

  // Корректировка накладных расходов
  updateOverheadCosts(overheadRub: number): void {
    const overhead = Number(overheadRub);
    if (isNaN(overhead) || overhead < 0) return;
    this.dailyOverheadCostsRub.set(overhead);
  }
}