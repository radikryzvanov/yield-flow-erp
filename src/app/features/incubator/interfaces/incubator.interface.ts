export type CabinetType = 'setter' | 'hatcher';
export type CabinetStatus = 'active' | 'warning' | 'empty';
export type IncubationStage = 'setting' | 'transfer' | 'hatching';

export interface IncubationCabinet {
  id: string;
  name: string;
  type: CabinetType;
  capacityEggs: number;
  currentEggs: number;
  currentDay: number;
  temperatureCelsius: number;
  targetTempCelsius: number;
  humidityPercent: number;
  targetHumidityPercent: number;
  eggTurningActive: boolean;
  status: CabinetStatus;
}

export interface IncubationBatch {
  id: string;
  batchNumber: string;
  eggSourceHouse: string;
  eggsSetCount: number;
  startDate: string;
  plannedHatchDate: string;
  cabinetId: string;
  stage: IncubationStage;
  expectedHatchRatePercent: number;
}

export interface HatchHistoryRecord {
  id: string;
  batchNumber: string;
  date: string;
  eggsSet: number;
  chicksHatched: number;
  hatchRatePercent: number;
}

export interface StartIncubationPayload {
  cabinetId: string;
  batchNumber: string;
  eggSourceHouse: string;
  eggsCount: number;
}