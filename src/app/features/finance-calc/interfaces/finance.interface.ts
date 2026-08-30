export interface FinancialMetric {
  title: string;
  value: number;
  unit: string;
  trendPercent: number;
  isPositiveTrendGood: boolean;
}

export interface CostBreakdownItem {
  category: string;
  amountRub: number;
  sharePercent: number;
  color: string;
}