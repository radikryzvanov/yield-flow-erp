export interface FeedSilo {
  id: string;
  name: string;
  recipeCode: string;       // Рецепт: ПК-1-1, ПК-1-2, ПК-3, ПК-1-П
  targetBird: string;       // Назначение комбикорма
  currentTons: number;      // Текущий остаток в силосе (т)
  capacityTons: number;     // Вместимость силоса (т)
  costPerTonRub: number;    // Себестоимость за тонну (руб)
}

export interface FeedLog {
  id: string;
  date: string;
  houseName: string;
  recipeCode: string;
  tonsDeducted: number;
}