import { Injectable, signal, computed, inject } from '@angular/core';
import { PoultryManagementService } from '../../poultry-management/services/poultry-management.service';
import { CostBreakdownItem } from '../interfaces/finance.interface';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly poultryService = inject(PoultryManagementService);

  readonly eggPrices = signal({
    'СВ': 115,
    'С0': 95,
    'С1': 82,
    'С2': 68,
    'Грязь/Насечка': 35
  });

  readonly feedCostPerKg = signal(22.50);
  readonly dailyOverheadCostsRub = signal(450_000);

  // Сбор данных из птичников
  readonly totalDailyEggs = computed(() => this.poultryService.totalDailyEggs());
  readonly dailyFeedTons = computed(() => this.poultryService.totalDailyFeedTons());

  // Расчёт затрат на корма за сутки
  readonly dailyFeedCostRub = computed(() => {
    return Math.round(this.dailyFeedTons() * 1000 * this.feedCostPerKg());
  });

  // Расчёт суточной выручки
  readonly dailyRevenueRub = computed(() => {
    const totalEggs = this.totalDailyEggs();
    if (totalEggs === 0) return 0;

    const revC0 = (totalEggs * 0.30 * 95) / 10;
    const revC1 = (totalEggs * 0.55 * 82) / 10;
    const revC2 = (totalEggs * 0.12 * 68) / 10;
    const revWaste = (totalEggs * 0.03 * 35) / 10;

    return Math.round(revC0 + revC1 + revC2 + revWaste);
  });

  // Себестоимость одного яйца
  readonly costPerEggRub = computed(() => {
    const totalEggs = this.totalDailyEggs();
    if (totalEggs === 0) return 0;
    const totalDailyCosts = this.dailyFeedCostRub() + this.dailyOverheadCostsRub();
    return Math.round((totalDailyCosts / totalEggs) * 100) / 100;
  });

  // Чистая суточная прибыль
  readonly dailyProfitRub = computed(() => {
    return this.dailyRevenueRub() - (this.dailyFeedCostRub() + this.dailyOverheadCostsRub());
  });

  // Рентабельность
  readonly profitabilityPercent = computed(() => {
    const revenue = this.dailyRevenueRub();
    if (revenue === 0) return 0;
    return Math.round((this.dailyProfitRub() / revenue) * 1000) / 10;
  });

  // Структура затрат
  readonly costBreakdown = computed<CostBreakdownItem[]>(() => {
    const feed = this.dailyFeedCostRub();
    const fot = 210_000;
    const energy = 120_000;
    const vet = 70_000;
    const other = 50_000;
    const total = feed + fot + energy + vet + other;

    return [
      { category: 'Комбикорма и рационы', amountRub: feed, sharePercent: Math.round((feed / total) * 100), color: '#d97706' },
      { category: 'Фонд оплаты труда (ФОТ)', amountRub: fot, sharePercent: Math.round((fot / total) * 100), color: '#2563eb' },
      { category: 'Энергоресурсы (Газ, Свет)', amountRub: energy, sharePercent: Math.round((energy / total) * 100), color: '#dc2626' },
      { category: 'Ветеринария и биозащита', amountRub: vet, sharePercent: Math.round((vet / total) * 100), color: '#16a34a' },
      { category: 'Амортизация и логистика', amountRub: other, sharePercent: Math.round((other / total) * 100), color: '#64748b' }
    ];
  });
}