import { Injectable, computed, signal } from '@angular/core';
import { DeliveryOrder, DispatchVehicle } from '../interfaces/logistics.interface';

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {
  private readonly _orders = signal<DeliveryOrder[]>([
    {
      id: 'ord-101',
      orderNumber: 'ЗАКАЗ-2026-88',
      customerName: 'Сеть гипермаркетов "Магнит"',
      productCategory: 'Мясо бройлера (охл.)',
      weightKg: 8500,
      requiredTempCelsius: '0...+2 °C',
      destinationCity: 'Казань',
      plannedDispatchDate: '2026-08-24',
      status: 'loading',
      vehicleNumber: 'А 777 АА 116',
      driverName: 'Хабибуллин Р. Т.'
    },
    {
      id: 'ord-102',
      orderNumber: 'ЗАКАЗ-2026-89',
      customerName: 'Птицеторг Регион',
      productCategory: 'Яйцо куриное (кат. C0/C1)',
      weightKg: 12000,
      requiredTempCelsius: '+4...+8 °C',
      destinationCity: 'Самара',
      plannedDispatchDate: '2026-08-24',
      status: 'pending'
    },
    {
      id: 'ord-103',
      orderNumber: 'ЗАКАЗ-2026-85',
      customerName: 'Хладокомбинат № 1',
      productCategory: 'Мясо бройлера (зам.)',
      weightKg: 18000,
      requiredTempCelsius: '-18 °C',
      destinationCity: 'Уфа',
      plannedDispatchDate: '2026-08-23',
      status: 'in_transit',
      vehicleNumber: 'В 543 ЕЕ 102',
      driverName: 'Петров С. В.'
    }
  ]);

  private readonly _vehicles = signal<DispatchVehicle[]>([
    {
      id: 'veh-1',
      plateNumber: 'А 777 АА 116',
      driverName: 'Хабибуллин Р. Т.',
      capacityTons: 10,
      hasRefrigerator: true,
      status: 'loading'
    },
    {
      id: 'veh-2',
      plateNumber: 'В 543 ЕЕ 102',
      driverName: 'Петров С. В.',
      capacityTons: 20,
      hasRefrigerator: true,
      status: 'on_route'
    },
    {
      id: 'veh-3',
      plateNumber: 'М 901 ТТ 116',
      driverName: 'Смирнов Д. А.',
      capacityTons: 15,
      hasRefrigerator: true,
      status: 'free'
    }
  ]);

  readonly orders = this._orders.asReadonly();
  readonly vehicles = this._vehicles.asReadonly();

  readonly totalWeightInTransitKg = computed(() =>
    this._orders()
      .filter(o => o.status === 'in_transit')
      .reduce((sum, o) => sum + o.weightKg, 0)
  );

  readonly activeOrdersCount = computed(() =>
    this._orders().filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length
  );

  readonly availableVehicles = computed(() =>
    this._vehicles().filter(v => v.status === 'free')
  );

  dispatchOrder(orderId: string, vehicleId: string): void {
    const vehicle = this._vehicles().find(v => v.id === vehicleId);
    if (!vehicle) return;

    this._orders.update(list =>
      list.map(ord =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'in_transit',
              vehicleNumber: vehicle.plateNumber,
              driverName: vehicle.driverName
            }
          : ord
      )
    );

    this._vehicles.update(list =>
      list.map(v => (v.id === vehicleId ? { ...v, status: 'on_route' } : v))
    );
  }

  markDelivered(orderId: string): void {
    const order = this._orders().find(o => o.id === orderId);
    if (!order) return;

    this._orders.update(list =>
      list.map(ord => (ord.id === orderId ? { ...ord, status: 'delivered' } : ord))
    );

    if (order.vehicleNumber) {
      this._vehicles.update(list =>
        list.map(v => (v.plateNumber === order.vehicleNumber ? { ...v, status: 'free' } : v))
      );
    }
  }
}