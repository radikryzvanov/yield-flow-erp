import { Entity } from '../../../core/interfaces/entity.interface';

export interface PoultryHouse extends Entity {
  name: string;
  capacity: number;
  description?: string;
  isActive: boolean;
}