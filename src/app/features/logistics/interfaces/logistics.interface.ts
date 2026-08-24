export type ShipmentStatus = 'pending' | 'loading' | 'in_transit' | 'delivered' | 'cancelled';
export type ProductCategory = 'Мясо бройлера (охл.)' | 'Мясо бройлера (зам.)' | 'Яйцо куриное (кат. C0/C1)' | 'Субпродукты';

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  productCategory: ProductCategory;
  weightKg: number;
  requiredTempCelsius: string;
  destinationCity: string;
  plannedDispatchDate: string;
  status: ShipmentStatus;
  vehicleNumber?: string;
  driverName?: string;
}

export interface DispatchVehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  capacityTons: number;
  hasRefrigerator: boolean;
  status: 'free' | 'loading' | 'on_route';
}