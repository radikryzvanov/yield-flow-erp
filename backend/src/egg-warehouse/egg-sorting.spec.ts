import { distributeSorting } from './egg-sorting.js';

describe('distributeSorting (сортировка яйца по категориям)', () => {
  it('сумма по категориям всегда равна размеру партии', () => {
    for (const total of [1, 2, 7, 99, 1001, 41035, 50199, 123457]) {
      const sum = distributeSorting(total).reduce((s, r) => s + r.count, 0);
      expect(sum).toBe(total);
    }
  });

  it('раскладывает 10000 яиц как 5% / 35% / 45% / 11% / 4%', () => {
    const counts = distributeSorting(10000).map((r) => r.count);
    expect(counts).toEqual([500, 3500, 4500, 1100, 400]);
  });

  it('никогда не даёт отрицательных значений, даже для крошечных партий', () => {
    for (const total of [1, 2, 3, 4, 5]) {
      for (const row of distributeSorting(total)) {
        expect(row.count).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
