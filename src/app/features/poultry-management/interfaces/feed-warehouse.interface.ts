import { Entity } from '../../../core/interfaces/entity.interface';

export type RawMaterialType = 'Зерновые' | 'Белковые' | 'Премиксы' | 'Минеральные/Вторичные';

export interface RawMaterialStock extends Entity {
  name: string;
  type: RawMaterialType;
  inStockKg: number;
  pricePerKg: number;
  minThresholdKg: number;
}

export interface FeedRecipe extends Entity {
  code: string;
  name: string;
  targetBirdType: 'Несушка' | 'Бройлер' | 'Молодняк';
  components: {
    materialId: string;
    percentage: number;
  }[];
  calculatedCostPerTon: number;
}

export interface FeedBatchProduction extends Entity {
  date: string;
  recipeCode: string;
  targetHouseId: string;
  producedTons: number;
  operatorName: string;
}