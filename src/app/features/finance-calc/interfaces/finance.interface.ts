export interface ProductionCostBreakdown {
  feedCostRub: number;
  chickCostRub: number;
  vetCostRub: number;
  energyCostRub: number;
  laborAndOtherRub: number;
  totalCostRub: number;
}

export interface BatchFinancialSummary {
  batchId: string;
  batchNumber: string;
  headsFinished: number;
  liveWeightTotalKg: number;
  feedConsumedTotalKg: number;
  fcr: number;
  costs: ProductionCostBreakdown;
  costPerKgLiveWeight: number;
  revenueRub: number;
  netProfitRub: number;
  profitMarginPercent: number;
}