import { EggCategory } from './egg-stock.entity.js';
import type { SortedYieldRow } from './egg-batch.entity.js';

/** Описания категорий для строк склада. */
export const CATEGORY_DESCRIPTIONS: Record<EggCategory, string> = {
  [EggCategory.Highest]: 'Высшая категория (>75г)',
  [EggCategory.Selected]: 'Отборное яйцо (65-74.9г)',
  [EggCategory.First]: 'Первая категория (55-64.9г)',
  [EggCategory.Second]: 'Вторая категория (45-54.9г)',
  [EggCategory.Third]: 'Третья категория (35-44.9г)',
  [EggCategory.Dirty]: 'Грязное яйцо',
  [EggCategory.Broken]: 'Технический брак / меланж',
};

/**
 * Стандартное промышленное распределение партии по категориям:
 * 5% высшая, 35% отборное, 45% первая, 11% вторая, остальное — бой.
 * Бой считаем как остаток, поэтому сумма категорий ВСЕГДА равна размеру партии.
 */
export function distributeSorting(totalEggs: number): SortedYieldRow[] {
  const highest = Math.round(totalEggs * 0.05);
  const selected = Math.round(totalEggs * 0.35);
  const first = Math.round(totalEggs * 0.45);
  const second = Math.round(totalEggs * 0.11);
  const broken = totalEggs - (highest + selected + first + second);

  return [
    { category: EggCategory.Highest, count: highest },
    { category: EggCategory.Selected, count: selected },
    { category: EggCategory.First, count: first },
    { category: EggCategory.Second, count: second },
    { category: EggCategory.Broken, count: broken },
  ];
}
