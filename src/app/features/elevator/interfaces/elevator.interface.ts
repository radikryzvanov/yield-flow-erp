export interface GrainSilo {
  id: string;
  name: string;
  culture: string;
  capacityTons: number;
  currentTons: number;
  moisturePercent: number;
  temperatureC: number;
  status: 'normal' | 'drying_required' | 'warning';
}

export interface GrainIntakeLog {
  id: string;
  date: string;
  truckNumber: string;
  culture: string;
  weightTons: number;
  moisturePercent: number;
  targetSiloId: string;
}