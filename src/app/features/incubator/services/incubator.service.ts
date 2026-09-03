import { Injectable, computed } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';
import { IncubatorCabinet, IncubationLog } from '../interfaces/incubator.interface';

@Injectable({
  providedIn: 'root'
})
export class IncubatorService {
  private readonly _cabinets = persistedSignal<IncubatorCabinet[]>('yieldflow_incubator_cabinets', [
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

  private readonly _logs = persistedSignal<IncubationLog[]>('yieldflow_incubator_logs', [
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

  // Закладка новой партии инкубационного яйца в шкаф
  setBatch(data: {
    cabinetId: string;
    batchNumber: string;
    crossType: string;
    eggsCount: number;
    expectedHatchRatePercent: number;
  }): boolean {
    const count = Number(data.eggsCount);
    if (!count || count <= 0) return false;

    let updated = false;

    this._cabinets.update(cabinets =>
      cabinets.map(cabinet => {
        if (cabinet.id === data.cabinetId) {
          updated = true;
          return {
            ...cabinet,
            batchNumber: data.batchNumber.trim(),
            crossType: data.crossType,
            eggsCount: count,
            setDay: 1,
            temperature: 37.8,
            targetTemperature: 37.8,
            humidityPercent: 55,
            targetHumidityPercent: 55,
            turnAngleDeg: 45,
            status: 'incubation',
            expectedHatchRatePercent: Number(data.expectedHatchRatePercent) || 88.0
          };
        }
        return cabinet;
      })
    );

    return updated;
  }

  // Фиксация вывода молодняка и перевод шкафа на дезинфекцию
  completeHatch(data: {
    cabinetId: string;
    chicksHatched: number;
    destinationHouse: string;
  }): boolean {
    const cabinet = this._cabinets().find(c => c.id === data.cabinetId);
    if (!cabinet || cabinet.eggsCount <= 0) return false;

    const hatched = Number(data.chicksHatched);
    if (isNaN(hatched) || hatched <= 0) return false;

    const hatchRate = Math.round((hatched / cabinet.eggsCount) * 1000) / 10;

    const timeFormatted = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());

    // 1. Добавляем запись в журнал вывода
    const log: IncubationLog = {
      id: `HATCH-${Date.now().toString().slice(-4)}`,
      date: `Сегодня, ${timeFormatted}`,
      batchNumber: cabinet.batchNumber,
      crossType: cabinet.crossType,
      eggsSet: cabinet.eggsCount,
      chicksHatched: hatched,
      actualHatchRate: hatchRate,
      destinationHouse: data.destinationHouse
    };

    this._logs.update(logs => [log, ...logs]);

    // 2. Освобождаем шкаф и отправляем на мойку/дезинфекцию
    this._cabinets.update(cabinets =>
      cabinets.map(c => {
        if (c.id === data.cabinetId) {
          return {
            ...c,
            batchNumber: '—',
            crossType: '—',
            eggsCount: 0,
            setDay: 0,
            temperature: 20.0,
            targetTemperature: 20.0,
            humidityPercent: 40,
            targetHumidityPercent: 40,
            turnAngleDeg: 0,
            status: 'sanitization',
            expectedHatchRatePercent: 0
          };
        }
        return c;
      })
    );

    return true;
  }
}