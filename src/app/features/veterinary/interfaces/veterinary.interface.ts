export interface VaccineScheduleItem {
  id: string;
  ageDays: number;              // Возраст птицы (в днях)
  targetHouse: string;          // Корпус / Птичник
  disease: string;              // Болезнь (Ньюкасла, Марека, Гамборо, Бронхит)
  vaccineName: string;          // Название препарата
  method: 'water' | 'spray' | 'injection' | 'in-ovo'; // Метод выпойки/спрея
  plannedDate: string;
  status: 'completed' | 'pending' | 'urgent';
  dosageDoses: number;
}

export interface DrugStockItem {
  id: string;
  name: string;                 // Наименование препарата
  category: 'Вакцины' | 'Антибиотики' | 'Витамины/Электролиты' | 'Дезинфектанты';
  batchNumber: string;
  stockDoses: number;
  unit: string;
  expiryDate: string;
  status: 'ok' | 'low' | 'expiring';
}

export interface HealthCheckLog {
  id: string;
  date: string;
  house: string;
  flockAgeWeeks: number;
  mortalityCount: number;       // Падёж (гол.)
  mortalityRatePercent: number; // % падежа
  clinicalSigns: string;        // Клинические признаки
  vetDoctor: string;            // Ответственный ветврач
  quarantineStatus: 'normal' | 'observation' | 'quarantine';
}