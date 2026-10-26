import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '../../../core/api/api-config.token';
import { AuthService } from '../../../core/auth/auth.service';
import { PoultryHouse, PoultryManagementService } from './poultry-management.service';

const API = 'http://api.test/api';

function house(overrides: Partial<PoultryHouse>): PoultryHouse {
  return {
    id: 'h1',
    name: 'Птичник № 1',
    birdType: 'layer',
    crossType: 'Ломанн Браун',
    ageDays: 200,
    status: 'active',
    birdCount: 1000,
    initialBirdCount: 1000,
    dailyEggCount: 950,
    actualLayingRatePercent: 95,
    targetLayingRatePercent: 94,
    feedPerBirdGrams: 100,
    targetFeedGrams: 100,
    temperature: 21,
    targetTemperature: 21,
    humidityPercent: 60,
    ...overrides
  };
}

describe('PoultryManagementService', () => {
  let service: PoultryManagementService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: API } },
        // Человек «не вошёл», поэтому автозагрузка не срабатывает — вызываем refresh() сами.
        { provide: AuthService, useValue: { isAuthenticated: signal(false) } }
      ]
    });
    service = TestBed.inject(PoultryManagementService);
    http = TestBed.inject(HttpTestingController);
  });

  const loadHouses = (houses: PoultryHouse[]) => {
    service.refresh();
    http.expectOne(`${API}/houses`).flush(houses);
  };

  it('загружает птичники с сервера и считает итоги', () => {
    loadHouses([
      house({ id: 'h1', birdCount: 1000, dailyEggCount: 950, actualLayingRatePercent: 95 }),
      house({ id: 'h2', birdCount: 3000, dailyEggCount: 2900, actualLayingRatePercent: 97 }),
      house({ id: 'h3', birdType: 'broiler', birdCount: 500, dailyEggCount: 0, actualLayingRatePercent: 0 })
    ]);

    expect(service.houses().length).toBe(3);
    expect(service.totalBirds()).toBe(4500);
    expect(service.totalDailyEggs()).toBe(3850);
    // Средняя яйценоскость считается только по несушкам: (95 + 97) / 2
    expect(service.averageLayingRate()).toBe(96);
    expect(service.loading()).toBeFalse();
  });

  it('при ошибке загрузки сохраняет понятное сообщение', () => {
    service.refresh();
    http.expectOne(`${API}/houses`).error(new ProgressEvent('error'), { status: 0 });

    expect(service.loadError()).toContain('Нет связи с сервером');
    expect(service.loading()).toBeFalse();
  });

  it('суточный отчёт уходит на сервер без houseId в теле и обновляет птичник в списке', () => {
    loadHouses([house({ id: 'h1', birdCount: 1000 })]);

    service
      .submitDailyReport({ houseId: 'h1', eggCount: 900, mortalityCount: 10, feedPerBirdGrams: 110 })
      .subscribe();
    const req = http.expectOne(`${API}/houses/h1/daily-reports`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ eggCount: 900, mortalityCount: 10, feedPerBirdGrams: 110 });
    req.flush(house({ id: 'h1', birdCount: 990, dailyEggCount: 900 }));

    expect(service.houses()[0].birdCount).toBe(990);
    expect(service.houses()[0].dailyEggCount).toBe(900);
  });

  it('если сервер отклонил отчёт, список птичников не меняется', () => {
    loadHouses([house({ id: 'h1', birdCount: 1000 })]);

    service.submitDailyReport({ houseId: 'h1', eggCount: 5, mortalityCount: 99999 }).subscribe({
      error: () => undefined
    });
    http
      .expectOne(`${API}/houses/h1/daily-reports`)
      .flush({ message: 'Падёж больше поголовья' }, { status: 400, statusText: 'Bad Request' });

    expect(service.houses()[0].birdCount).toBe(1000);
  });

  it('приём молодняка и убытие птицы обновляют поголовье', () => {
    loadHouses([house({ id: 'h1', birdCount: 1000 })]);

    service.receiveNewFlock('h1', 500).subscribe();
    const receive = http.expectOne(`${API}/houses/h1/receive-flock`);
    expect(receive.request.body).toEqual({ birdsCount: 500 });
    receive.flush(house({ id: 'h1', birdCount: 1500 }));
    expect(service.totalBirds()).toBe(1500);

    service.removeBirds('h1', 200).subscribe();
    const remove = http.expectOne(`${API}/houses/h1/remove-birds`);
    expect(remove.request.body).toEqual({ birdsCount: 200 });
    remove.flush(house({ id: 'h1', birdCount: 1300 }));
    expect(service.totalBirds()).toBe(1300);
  });
});
