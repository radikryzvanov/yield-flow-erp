export type VaccinationMethod = 'выпойка' | 'аэрозоль (спрей)' | 'инъекция' | 'инкубаторий';

export interface VaccineRecord {
  id: string;
  batchNumber: string;         // Номер партии птицы
  houseId: string;             // Корпус/птичник
  birdAgeDays: number;         // Возраст птицы в днях на момент вакцинации
  vaccineName: string;         // Название вакцины (например, Марек, Ньюкасла, Гамборо)
  plannedDate: string;         // Плановая дата
  completedDate?: string;      // Фактическая дата проведения
  status: 'planned' | 'completed' | 'overdue';
  method: VaccinationMethod;
  veterinarian: string;
}

export interface MedicationStock {
  id: string;
  name: string;
  category: 'вакцина' | 'антибиотик' | 'витаминный комплекс' | 'дезинфектант';
  quantity: number;
  unit: 'доз' | 'л' | 'кг' | 'фл';
  minThreshold: number;
  expiryDate: string;
}

export interface MortalityLog {
  id: string;
  date: string;
  houseId: string;
  batchNumber: string;
  count: number;               // Количество голов падежа
  reason: string;              // Причина (асцит, травма, инфекция, технологический отход)
  vetConfirmed: boolean;
}