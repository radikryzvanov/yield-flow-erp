import { Injectable, signal, computed } from '@angular/core';
import { IncubatorCabinet, IncubationLog } from '../interfaces/incubator.interface';

@Injectable({
  providedIn: 'root'
})
export class IncubatorService {
  private readonly _cabinets = signal<IncubatorCabinet[]>([
    {
      id: 'inc-1',
      name: 'Шкаф инкубационный № 1 (Petersime AirStream)',
      type: 'setter',
      batchNumber: 'ПАРТИЯ-ИЯ-104',
      crossType: 'Ломанн ЛСЛ Классик',
      eggsCount: 57600,
      setDay: 6, // 1-я фаза: формирование кровеносной системы
      temperature: 37.8,
      targetTemperature: 37.8,
      humidityPercent: 54,
      targetHumidityPercent: 55,
      turnAngleDeg: 45,
      status: 'incubation',
      expectedHatchRatePercent: 88.5
    },
    {
      id: 'inc-2',
      name: 'Шкаф инкубационный № 2 (Petersime AirStream)',
      type: 'setter',
      batchNumber: 'ПАРТИЯ-ИЯ-102',
      crossType: 'Декалб Белый',
      eggsCount: 57600,
      setDay: 18, // День переноса на вывод и контрольного миражирования
      temperature: 37.5,
      targetTemperature: 37.5,
      humidityPercent: 58,
      targetHumidityPercent: 58,
      turnAngleDeg: 0,
      status: 'candling',
      expectedHatchRatePercent: 86.2
    },
    {
      id: 'inc-3',
      name: 'Шкаф выводной № 1 (Petersime BioHatcher)',
      type: 'hatcher',
      batchNumber: 'ПАРТИЯ-ИЯ-101',
      crossType: 'Ломанн ЛСЛ Классик',
      eggsCount: 54000,
      setDay: 21, // Массовый наклев и вывод суточного молодняка
      temperature: 36.9,
      targetTemperature: 36.8,
      humidityPercent: 72, // Высокая влажность для легкого проклева
      targetHumidityPercent: 70,
      turnAngleDeg: 0,
      status: 'hatching',
      expectedHatchRatePercent: 89.0
    },
    {
      id: 'inc-4',
      name: 'Шкаф выводной № 2 (Petersime BioHatcher)',
      type: 'hatcher',
      batchNumber: '—',
      crossType: '—',
      eggsCount: 0,
      setDay: 0,
      temperature: 20.0,
      targetTemperature: 20.0,
      humidityPercent: 40,
      targetHumidityPercent: 40,
      turnAngleDeg: 0,
      status: 'sanitization', // Мойка и аэрозольная дезинфекция
      expectedHatchRatePercent: 0
    }
  ]);

  private readonly _logs = signal<IncubationLog[]>([
    {
      id: 'HATCH-901',
      date: 'Вчера, 16:00',
      batchNumber: 'ПАРТИЯ-ИЯ-099',
      crossType: 'Ломанн ЛСЛ Классик',
      eggsSet: 57600,
      chicksHatched: 51264,
      actualHatchRate: 89.0,
      destinationHouse: 'Птичник № 3 (Ремонтный молодняк)'
    },
    {
      id: 'HATCH-900',
      date: '3 дня назад',
      batchNumber: 'ПАРТИЯ-ИЯ-098',
      crossType: 'Хайсекс Браун',
      eggsSet: 28800,
      chicksHatched: 24912,
      actualHatchRate: 86.5,
      destinationHouse: 'Племблок (Корпус № 4)'
    }
  ]);

  readonly cabinets = this._cabinets.asReadonly();
  readonly logs = this._logs.asReadonly();

  // Общее количество яиц на инкубации
  readonly totalEggsInIncubation = computed(() =>
    this._cabinets().reduce((sum, c) => sum + c.eggsCount, 0)
  );

  // Количество активных шкафов
  readonly activeCabinetsCount = computed(() =>
    this._cabinets().filter(c => c.status !== 'sanitization').length
  );

  // Средний прогноз вывода цыплят
  readonly averageHatchForecast = computed(() => {
    const active = this._cabinets().filter(c => c.eggsCount > 0);
    if (active.length === 0) return 0;
    const totalRate = active.reduce((sum, c) => sum + c.expectedHatchRatePercent, 0);
    return Math.round((totalRate / active.length) * 10) / 10;
  });

  // Ожидаемый суточный молодняк
  readonly expectedChicksCount = computed(() => {
    return Math.round(
      this._cabinets().reduce((sum, c) => sum + (c.eggsCount * c.expectedHatchRatePercent / 100), 0)
    );
  });
}