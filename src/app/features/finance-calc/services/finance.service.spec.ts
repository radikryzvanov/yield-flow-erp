import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EggWarehouseService } from '../../poultry-management/services/egg-warehouse.service';
import { FeedWarehouseService } from '../../feed-warehouse/services/feed-warehouse.service';
import { PoultryManagementService } from '../../poultry-management/services/poultry-management.service';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  const stocks = signal<{ category: string; count: number }[]>([]);
  const totalDailyEggs = signal(0);
  const totalDailyFeedTons = signal(0);

  function setup(): FinanceService {
    TestBed.configureTestingModule({
      providers: [
        { provide: EggWarehouseService, useValue: { stocks } },
        { provide: FeedWarehouseService, useValue: {} },
        { provide: PoultryManagementService, useValue: { totalDailyEggs, totalDailyFeedTons } },
      ],
    });
    return TestBed.inject(FinanceService);
  }

  beforeEach(() => {
    localStorage.clear();
    stocks.set([
      { category: 'С0', count: 100 },
      { category: 'С1', count: 100 },
    ]);
    totalDailyEggs.set(1000);
    totalDailyFeedTons.set(2);
  });

  it('считает выручку по долям категорий и ценам', () => {
    const service = setup();
    // половина яиц С0 по 9.8 и половина С1 по 8.5: 500*9.8 + 500*8.5
    expect(service.dailyRevenueRub()).toBe(9150);
  });

  it('выручка равна нулю, если на складе нет яйца', () => {
    stocks.set([]);
    const service = setup();
    expect(service.dailyRevenueRub()).toBe(0);
  });

  it('считает стоимость кормов: тонны * 1000 * цена за кг', () => {
    const service = setup();
    expect(service.dailyFeedCostRub()).toBe(57000);
  });

  it('прибыль = выручка минус корма и накладные расходы', () => {
    const service = setup();
    service.updateOverheadCosts(10000);
    expect(service.totalDailyExpensesRub()).toBe(67000);
    expect(service.dailyProfitRub()).toBe(9150 - 67000);
  });

  it('себестоимость яйца: расходы делятся на суточный сбор', () => {
    const service = setup();
    service.updateOverheadCosts(10000);
    expect(service.costPerEggRub()).toBe(67);
  });

  it('себестоимость равна нулю, если яйцо не собирают', () => {
    totalDailyEggs.set(0);
    const service = setup();
    expect(service.costPerEggRub()).toBe(0);
  });

  it('отрицательные и некорректные значения превращаются в ноль', () => {
    const service = setup();
    service.updateEggPrice('С1', -5);
    service.updateFeedCostPerKg(NaN);
    service.updateOverheadCosts(-100);
    expect(service.eggPrices()['С1']).toBe(0);
    expect(service.feedCostPerKg()).toBe(0);
    expect(service.dailyOverheadCosts()).toBe(0);
  });

  it('структура затрат: доли в сумме дают 100%', () => {
    const service = setup();
    service.updateOverheadCosts(10000);
    const items = service.costBreakdown();
    expect(items.length).toBe(2);
    const sum = items.reduce((s, i) => s + i.sharePercent, 0);
    expect(Math.round(sum)).toBe(100);
  });

  it('структура затрат пустая, если расходов нет', () => {
    totalDailyFeedTons.set(0);
    const service = setup();
    service.updateOverheadCosts(0);
    expect(service.costBreakdown()).toEqual([]);
  });
});
