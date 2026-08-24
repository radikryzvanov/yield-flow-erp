export type IncubationStage = 'setting' | 'hatching' | 'completed';

export interface IncubationCabinet {
  id: string;
  name: string;
  type: 'setter' | 'hatcher'; // Инкубационный (1-18 день) или выводной (19-21 день)
  capacityEggs: number;
  currentEggs: number;
  currentDay: number;
  temperatureCelsius: number;
  targetTempCelsius: number;
  humidityPercent: number;
  targetHumidityPercent: number;
  eggTurningActive: boolean;
  status: 'active' | 'empty' | 'warning';
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