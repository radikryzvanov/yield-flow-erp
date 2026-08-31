export interface SlaughterLine {
  id: string;
  name: string;
  speedBirdsPerHour: number;
  targetSpeed: number;
  currentBatch: string;
  birdsProcessedToday: number;
  targetBirdsToday: number;
  averageLiveWeightKg: number;
  meatYieldPercent: number;
  status: 'running' | 'paused' | 'sanitization';
}

export interface MeatProductYield {
  id: string;
  category: string;
  yieldKg: number;
  sharePercent: number;
  pricePerKgRub: number;
  destination: string;
}

export interface SlaughterBatchLog {
  id: string;
  date: string;
  sourceHouse: string;
  birdsCount: number;
  totalLiveWeightTons: number;
  totalMeatYieldTons: number;
  firstGradePercent: number;
  vetInspectionStatus: 'passed' | 'rejected';
}