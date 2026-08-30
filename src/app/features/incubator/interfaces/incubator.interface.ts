export interface IncubatorCabinet {
  id: string;
  name: string;                   // Инкубационный шкаф № 1 (Petersime)
  type: 'setter' | 'hatcher';     // Предварительный (инкубационный) / Выводной
  batchNumber: string;            // Партия ИЯ-2026-88
  crossType: string;              // Ломанн ЛСЛ Классик, Хайсекс Браун
  eggsCount: number;              // Количество заложенных яиц
  setDay: number;                 // День инкубации (1–21)
  temperature: number;            // Факт температура (°C)
  targetTemperature: number;      // Норма (°C)
  humidityPercent: number;        // Факт влажность (%)
  targetHumidityPercent: number;  // Норма влажности (%)
  turnAngleDeg: number;           // Угол поворота лотков (45°)
  status: 'incubation' | 'candling' | 'hatching' | 'sanitization';
  expectedHatchRatePercent: number; // Прогноз вывода (%)
}

export interface IncubationLog {
  id: string;
  date: string;
  batchNumber: string;
  crossType: string;
  eggsSet: number;
  chicksHatched: number;
  actualHatchRate: number;
  destinationHouse: string;
}