export interface SlaughterBatch {
  id: string;
  batchNumber: string;         // Номер партии из птичника
  houseId: string;             // Корпус
  headsCount: number;          // Голов на убой
  liveWeightKg: number;        // Общий живой вес (кг)
  avgWeightKg: number;         // Средний вес 1 головы
  arrivalDate: string;
}

export interface SlaughterYield {
  grade1Kg: number;            // Тушка ГОСТ 1 сорт (кг)
  grade2Kg: number;            // Тушка 2 сорт (кг)
  byProductsKg: number;        // Субпродукты (печень, сердце, желудки) (кг)
  wasteKg: number;             // Перо, кровь, тех. отходы (кг)
  condemnedKg: number;         // Ветеринарный конфискат/брак (кг)
}

export interface SlaughterReport {
  id: string;
  date: string;
  batchNumber: string;
  houseId: string;
  initialLiveWeightKg: number;
  initialHeads: number;
  yield: SlaughterYield;
  meatYieldPercentage: number; // Процент выхода мяса ((grade1 + grade2) / liveWeight * 100)
  status: 'in_progress' | 'completed';
}