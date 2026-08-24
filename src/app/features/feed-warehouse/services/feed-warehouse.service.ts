import { Injectable, signal, computed } from '@angular/core';

export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  currentStockTons: number;
  minimumStockLimitTons: number;
  costPerTonRub: number;
}

export interface RecipeComponent {
  materialId: string;
  percentage: number;
}

export interface FeedRecipe {
  id: string;
  code: string;
  name: string;
  targetPoultryAge: string;
  components: RecipeComponent[];
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  date: string;
  recipeCode: string;
  targetHouseId: string;
  producedTons: number;
  costPerTonRub: number;
  operatorName: string;
}

export interface CreateBatchDto {
  date: string;
  recipeCode: string;
  targetHouseId: string;
  producedTons: number;
  operatorName: string;
}

@Injectable({
  providedIn: 'root',
})
export class FeedWarehouseService {
  private readonly rawMaterialsSignal = signal<RawMaterial[]>([
    {
      id: 'rm-1',
      name: 'Пшеница фуражная',
      category: 'Зерновые',
      currentStockTons: 45.5,
      minimumStockLimitTons: 10.0,
      costPerTonRub: 14000,
    },
    {
      id: 'rm-2',
      name: 'Шрот соевый (46% протеин)',
      category: 'Белковые добавки',
      currentStockTons: 18.2,
      minimumStockLimitTons: 5.0,
      costPerTonRub: 42000,
    },
    {
      id: 'rm-3',
      name: 'Премикс Бройлер Финиш 1%',
      category: 'Микроэлементы',
      currentStockTons: 2.4,
      minimumStockLimitTons: 1.0,
      costPerTonRub: 120000,
    },
  ]);

  private readonly recipesSignal = signal<FeedRecipe[]>([
    {
      id: 'rec-1',
      code: 'ПК-1-1',
      name: 'Старт для цыплят',
      targetPoultryAge: '1-10 дней',
      components: [
        { materialId: 'rm-1', percentage: 60 },
        { materialId: 'rm-2', percentage: 35 },
        { materialId: 'rm-3', percentage: 5 },
      ],
    },
    {
      id: 'rec-2',
      code: 'ПК-5-4',
      name: 'Рост бройлер',
      targetPoultryAge: '11-24 дня',
      components: [
        { materialId: 'rm-1', percentage: 65 },
        { materialId: 'rm-2', percentage: 30 },
        { materialId: 'rm-3', percentage: 5 },
      ],
    },
  ]);

  private readonly productionBatchesSignal = signal<ProductionBatch[]>([]);

  readonly rawMaterials = this.rawMaterialsSignal.asReadonly();
  readonly recipes = this.recipesSignal.asReadonly();
  readonly productionBatches = this.productionBatchesSignal.asReadonly();

  readonly totalStockTons = computed(() => {
    return this.rawMaterialsSignal().reduce(
      (sum, item) => sum + item.currentStockTons,
      0
    );
  });

  produceFeedBatch(dto: CreateBatchDto): void {
    const newBatch: ProductionBatch = {
      id: `batch-${Date.now()}`,
      batchNumber: `ПАРТ-${Math.floor(1000 + Math.random() * 9000)}`,
      date: dto.date,
      recipeCode: dto.recipeCode,
      targetHouseId: dto.targetHouseId,
      producedTons: dto.producedTons,
      costPerTonRub: 22500,
      operatorName: dto.operatorName,
    };

    const recipe = this.recipesSignal().find((r) => r.code === dto.recipeCode);

    if (recipe) {
      this.rawMaterialsSignal.update((materials) =>
        materials.map((mat) => {
          const comp = recipe.components.find(
            (c: RecipeComponent) => c.materialId === mat.id
          );
          if (comp) {
            const usedTons = (dto.producedTons * comp.percentage) / 100;
            return {
              ...mat,
              currentStockTons: Math.max(
                0,
                Number((mat.currentStockTons - usedTons).toFixed(2))
              ),
            };
          }
          return mat;
        })
      );
    }

    this.productionBatchesSignal.update((batches) => [newBatch, ...batches]);
  }
}