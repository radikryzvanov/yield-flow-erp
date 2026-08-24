import { Injectable, computed, signal } from '@angular/core';
import { BatchFinancialSummary } from '../interfaces/finance.interface';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private readonly _batchSummaries = signal<BatchFinancialSummary[]>([
    {
      batchId: 'batch-01',
      batchNumber: 'ПАРТИЯ-2026-07',
      headsFinished: 24200,
      liveWeightTotalKg: 62920,
      feedConsumedTotalKg: 100672,
      fcr: 1.60,
      costs: {
        feedCostRub: 3523520,
        chickCostRub: 1089000,
        vetCostRub: 290400,
        energyCostRub: 363000,
        laborAndOtherRub: 484000,
        totalCostRub: 5749920
      },
      costPerKgLiveWeight: 91.38,
      revenueRub: 7550400,
      netProfitRub: 1800480,
      profitMarginPercent: 23.85
    },
    {
      batchId: 'batch-02',
      batchNumber: 'ПАРТИЯ-2026-06',
      headsFinished: 23800,
      liveWeightTotalKg: 60690,
      feedConsumedTotalKg: 100138,
      fcr: 1.65,
      costs: {
        feedCostRub: 3504830,
        chickCostRub: 1071000,
        vetCostRub: 333200,
        energyCostRub: 380800,
        laborAndOtherRub: 476000,
        totalCostRub: 5765830
      },
      costPerKgLiveWeight: 95.00,
      revenueRub: 7161420,
      netProfitRub: 1395590,
      profitMarginPercent: 19.49
    }
  ]);

  readonly batchSummaries = this._batchSummaries.asReadonly();

  readonly totalRevenue = computed(() =>
    this._batchSummaries().reduce((acc, b) => acc + b.revenueRub, 0)
  );

  readonly totalCost = computed(() =>
    this._batchSummaries().reduce((acc, b) => acc + b.costs.totalCostRub, 0)
  );

  readonly totalNetProfit = computed(() =>
    this._batchSummaries().reduce((acc, b) => acc + b.netProfitRub, 0)
  );

  readonly averageFcr = computed(() => {
    const list = this._batchSummaries();
    if (list.length === 0) return 0;
    return list.reduce((acc, b) => acc + b.fcr, 0) / list.length;
  });

  calculateForecast(params: {
    headsCount: number;
    targetWeightKg: number;
    expectedFcr: number;
    feedPricePerKg: number;
    chickPricePerHead: number;
    vetAndOtherPerHead: number;
    sellingPricePerKg: number;
  }) {
    const totalLiveWeight = params.headsCount * params.targetWeightKg;
    const totalFeedKg = totalLiveWeight * params.expectedFcr;

    const feedCost = totalFeedKg * params.feedPricePerKg;
    const chickCost = params.headsCount * params.chickPricePerHead;
    const otherCost = params.headsCount * params.vetAndOtherPerHead;
    const totalCost = feedCost + chickCost + otherCost;

    const revenue = totalLiveWeight * params.sellingPricePerKg;
    const netProfit = revenue - totalCost;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const costPerKg = totalLiveWeight > 0 ? totalCost / totalLiveWeight : 0;

    return {
      totalLiveWeight,
      totalFeedKg,
      totalCost,
      costPerKg,
      revenue,
      netProfit,
      margin
    };
  }
}