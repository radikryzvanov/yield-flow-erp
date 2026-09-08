export interface ShipmentOrder {
  id: string;
  clientName: string;
  destinationCity: string;
  productType: string;
  quantityUnits: number;
  unit: string;
  carrierVehicle: string;
  driverName: string;
  tempInsideCelsius: number;
  departureTime: string;
  mercuryDocStatus: 'approved' | 'pending' | 'rejected';
  shippingStatus: 'loading' | 'in_transit' | 'delivered';
  deliveredOnTime?: boolean;
}

export interface FleetVehicle {
  id: string;
  plateNumber: string;
  model: string;
  capacityTons: number;
  coolingMode: string;
  currentLocation: string;
  telemetryTempC: number;
  status: 'active' | 'loading' | 'maintenance';
}

export interface LogisticsKpi {
  totalDailyShippedTons: number;
  activeVehiclesCount: number;
  onTimeRatePercent: number;
  approvedMercuryDocsCount: number;
}