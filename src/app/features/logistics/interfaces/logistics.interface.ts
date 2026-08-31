export interface ShipmentOrder {
  id: string;                      // Номер отгрузки / Заказа
  clientName: string;              // X5 Retail Group (Пятёрочка), Тандер (Магнит), ВкусВилл
  destinationCity: string;         // Город назначения (Москва РЦ, Казань РЦ, Самара)
  productType: string;             // Яйцо СО / С1, Охлажденная тушка ГОСТ
  quantityUnits: number;           // Количество коробок / паллет / кг
  unit: string;                    // кор. / паллет / тонн
  carrierVehicle: string;          // Госномер ТС (КАМАЗ Р620ТВ / Scania О114АК)
  driverName: string;              // Водитель
  tempInsideCelsius: number;       // Телеметрия рефрижератора (°C)
  departureTime: string;           // Время выезда / плановое прибытие
  mercuryDocStatus: 'approved' | 'in_progress' | 'error'; // Статус ВСД «Меркурий»
  shippingStatus: 'loading' | 'in_transit' | 'delivered';
}

export interface FleetVehicle {
  id: string;
  plateNumber: string;             // Госномер
  model: string;                   // Модель ТС (Scania R450 Ref, КАМАЗ 5490 Neo)
  capacityTons: number;            // Грузоподъемность (т)
  coolingMode: string;             // Режим (+2..+4°C / -18°C)
  currentLocation: string;         // Текущий гео-статус
  telemetryTempC: number;          // Датчик холода
  status: 'active' | 'loading' | 'service';
}

export interface LogisticsKpi {
  dailyShippedTons: number;        // Отгружено за сутки (т)
  activeVehiclesOnRoute: number;   // Машин на маршрутах
  onTimeDeliveryRatePercent: number; // Соблюдение тайм-слотов РЦ (%)
  mercuryDocsIssuedCount: number;  // Сформировано ВСД
}