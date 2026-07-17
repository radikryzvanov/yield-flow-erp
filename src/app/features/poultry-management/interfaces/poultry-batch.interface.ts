import { Entity } from '../../../core/interfaces/entity.interface';

export interface PoultryBatch extends Entity {
  houseId: string;
  batchNumber: string;
  initialCount: number;
  currentCount: number;
  placementDate: string;
  status: 'active' | 'completed';
}