import { Injectable, computed } from '@angular/core';
import { persistedSignal } from '../../../shared/utils/persisted-signal';
import { ShipmentOrder, FleetVehicle, LogisticsKpi } from '../interfaces/logistics.interface';

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {
  private readonly _shipments = persistedSignal<ShipmentOrder[]>('yieldflow_logistics_shipments', [
    {
      id: 'SH-2026-881',
      clientName: 'X5 Retail Group (РЦ Подольск)',
      destinationCity: 'Москва и МО',
      productType: 'Яйцо куриное столовое С0 (ГОСТ 31654)',
      quantityUnits: 720,
      unit: 'кор. (259 200 шт)',
      carrierVehicle: 'Scania Р440АК 73',
      driverName: 'Сергеев В. А.',
      tempInsideCelsius: 4.2,
      departureTime: 'Отправлен: 06:30 (Слот РЦ: 16:00)',
      mercuryDocStatus: 'approved',
      shippingStatus: 'in_transit'
    },
    {
      id: 'SH-2026-882',
      clientName: 'АО «Тандер» (Магнит РЦ Самара)',
      destinationCity: 'Самара',
      productType: 'Яйцо куриное столовое С1 (Брендированное)',
      quantityUnits: 650,
      unit: 'кор. (234 000 шт)',
      carrierVehicle: 'КАМАЗ 5490 М812ТУ 73',
      driverName: 'Калинин А. Д.',
      tempInsideCelsius: 3.8,
      departureTime: 'Погрузка: Ворота № 3 (Выезд: 14:00)',
      mercuryDocStatus: 'approved',
      shippingStatus: 'loading'
    },
    {
      id: 'SH-2026-883',
      clientName: 'Сеть супермаркетов «ВкусВилл»',
      destinationCity: 'Нижний Новгород',
      productType: 'Охлажденная тушка куры 1 сорт (Лотки)',
      quantityUnits: 8.5,
      unit: 'тонн',
      carrierVehicle: 'MAN TGM У332ЕК 73',
      driverName: 'Михайлов Е. П.',
      tempInsideCelsius: 2.1,
      departureTime: 'Отправлен: 08:15 (Слот РЦ: 14:30)',
      mercuryDocStatus: 'approved',
      shippingStatus: 'in_transit'
    },
    {
      id: 'SH-2026-884',
      clientName: 'Оптовый склад Ульяновск (Локальная сеть)',
      destinationCity: 'Ульяновск',
      productType: 'Яйцо столовое С2 + Меланж яичный',
      quantityUnits: 340,
      unit: 'кор.',
      carrierVehicle: 'ГАЗон Next К552РН 73',
      driverName: 'Федоров И. С.',
      tempInsideCelsius: 5.0,
      departureTime: 'Доставлен: 10:45 (Разгружен)',
      mercuryDocStatus: 'approved',
      shippingStatus: 'delivered'
    }
  ]);

  private readonly _fleet = persistedSignal<FleetVehicle[]>('yieldflow_logistics_fleet', [
    {
      id: 'FL-01',
      plateNumber: 'Р 440 АК 73',
      model: 'Scania R450 ThermoKing',
      capacityTons: 20,
      coolingMode: '+2°C .. +4°C (Яйцо)',
      currentLocation: 'Трасса М-5 (км 712)',
      telemetryTempC: 4.2,
      status: 'active'
    },
    {
      id: 'FL-02',
      plateNumber: 'М 812 ТУ 73',
      model: 'КАМАЗ 5490 Neo Carrier',
      capacityTons: 20,
      coolingMode: '+2°C .. +4°C (Яйцо)',
      currentLocation: 'На рампе погрузки № 3',
      telemetryTempC: 3.8,
      status: 'loading'
    },
    {
      id: 'FL-03',
      plateNumber: 'У 332 ЕК 73',
      model: 'MAN TGM Рефрижератор',
      capacityTons: 10,
      coolingMode: '0°C .. +2°C (Мясо охл.)',
      currentLocation: 'Трасса Р-158 (Подъезд к РЦ)',
      telemetryTempC: 2.1,
      status: 'active'
    },
    {
      id: 'FL-04',
      plateNumber: 'К 552 РН 73',
      model: 'ГАЗон Next Изотерм',
      capacityTons: 5,
      coolingMode: '+4°C (Городская развозка)',
      currentLocation: 'База фабрики (Возврат)',
      telemetryTempC: 5.0,
      status: 'active'
    }
  ]);

  readonly shipments = this._shipments.asReadonly();
  readonly fleet = this._fleet.asReadonly();

  readonly totalDailyShippedTons = computed(() => {
    const tonsDirect = this._shipments()
      .filter(s => s.unit.includes('тонн') && s.shippingStatus !== 'loading')
      .reduce((sum, s) => sum + Number(s.quantityUnits), 0);
    const eggBoxes = this._shipments()
      .filter(s => s.unit.includes('кор') && s.shippingStatus !== 'loading')
      .reduce((sum, s) => sum + Number(s.quantityUnits), 0);
    const eggTons = (eggBoxes * 360 * 0.06) / 1000;
    return Math.round((tonsDirect + eggTons) * 10) / 10;
  });

  readonly activeVehiclesCount = computed(() => this._fleet().filter(f => f.status === 'active').length);
  readonly onTimeRatePercent = computed(() => 99.4);
  readonly approvedMercuryDocsCount = computed(() => this._shipments().filter(s => s.mercuryDocStatus === 'approved').length);

  updateShipmentStatus(shipmentId: string, status: ShipmentOrder['shippingStatus']): void {
    this._shipments.update(items =>
      items.map(s => (s.id === shipmentId ? { ...s, shippingStatus: status } : s))
    );
  }

  updateVehicleStatus(vehicleId: string, status: FleetVehicle['status']): void {
    this._fleet.update(items =>
      items.map(v => (v.id === vehicleId ? { ...v, status } : v))
    );
  }

  createShipment(order: Omit<ShipmentOrder, 'id' | 'mercuryDocStatus'>): void {
    const newOrder: ShipmentOrder = {
      ...order,
      id: `SH-2026-${Math.floor(100 + Math.random() * 900)}`,
      mercuryDocStatus: 'approved'
    };
    this._shipments.update(items => [newOrder, ...items]);
  }
}