export interface VaccineScheduleItem {
  id: string;
  targetHouse: string;
  disease: string;
  vaccineName: string;
  ageDays: number;
  method: 'water' | 'spray' | 'injection' | 'in-ovo';
  dosageDoses: number;
  status: 'urgent' | 'pending' | 'completed';
  drugStockId?: string;
}

export interface DrugStockItem {
  id: string;
  name: string;
  stockDoses: number;
  unit: string;
  batchNumber: string;
  expiryDate: string;
  category: 'vaccine' | 'antibiotic' | 'vitamin' | 'disinfectant';
  status: 'sufficient' | 'low' | 'critical';
}

export interface HealthCheckLog {
  id: string;
  date: string;
  house: string;
  flockAgeWeeks: number;
  mortalityCount: number;
  mortalityRatePercent: number;
  clinicalSigns: string;
  vetDoctor: string;
  quarantineStatus: 'normal' | 'observation' | 'quarantine';
}