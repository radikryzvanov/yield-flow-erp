import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_CONFIG } from '../../../core/api/api-config.token';
import { AuthService } from '../../../core/auth/auth.service';
import { EggStock } from '../interfaces/egg-warehouse.interface';
import { EggWarehouseService } from './egg-warehouse.service';

const API = 'http://api.test/api';

const stocks = (sv: number): EggStock[] => [
  { category: 'СВ', description: 'Высшая', count: sv, unit: 'шт' },
  { category: 'СО', description: 'Отборное', count: 200, unit: 'шт' }
];

const batch = (id: string, status: 'pending' | 'sorted', rawEggCount = 1000) => ({
  id,
  houseName: 'Птичник № 1',
  rawEggCount,
  status,
  receivedAt: '2026-10-26T08:30:00.000Z'
});

describe('EggWarehouseService', () => {
  let service: EggWarehouseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: API } },
        { provide: AuthService, useValue: { isAuthenticated: signal(false) } }
      ]
    });
    service = TestBed.inject(EggWarehouseService);
    http = TestBed.inject(HttpTestingController);
  });

  const load = () => {
    service.refresh();
    http.expectOne(`${API}/egg-warehouse/batches`).flush([batch('b1', 'pending', 1000), batch('b2', 'sorted', 500)]);
    http.expectOne(`${API}/egg-warehouse/stocks`).flush(stocks(100));
  };

  it('загружает партии и остатки и считает итоги', () => {
    load();

    expect(service.incomingBatches().length).toBe(2);
    expect(service.incomingBatches()[0].date).toMatch(/\d{2}\.\d{2}/);
    expect(service.totalStockEggs()).toBe(300);
    // «Ожидает сортировки» — только партии со статусом pending
    expect(service.totalPendingRawEggs()).toBe(1000);
  });

  it('приёмка партии отправляет id птичника и добавляет партию в начало списка', () => {
    load();

    service.registerIncomingEggs('h1', 777).subscribe();
    const req = http.expectOne(`${API}/egg-warehouse/batches`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ houseId: 'h1', rawEggCount: 777 });
    req.flush(batch('b3', 'pending', 777));

    expect(service.incomingBatches()[0].id).toBe('b3');
    expect(service.totalPendingRawEggs()).toBe(1777);
  });

  it('сортировка: партия получает статус «рассортирована», остатки берутся с сервера', () => {
    load();

    service.sortBatch('b1').subscribe();
    http.expectOne(`${API}/egg-warehouse/batches/b1/sort`).flush(batch('b1', 'sorted', 1000));
    http.expectOne(`${API}/egg-warehouse/stocks`).flush(stocks(150));

    expect(service.incomingBatches().find(b => b.id === 'b1')?.status).toBe('sorted');
    expect(service.totalPendingRawEggs()).toBe(0);
    expect(service.totalStockEggs()).toBe(350);
  });

  it('если партию уже рассортировали (409), данные перезагружаются', () => {
    load();
    let failed = false;

    service.sortBatch('b1').subscribe({ error: () => (failed = true) });
    http
      .expectOne(`${API}/egg-warehouse/batches/b1/sort`)
      .flush({ message: 'Партия уже рассортирована' }, { status: 409, statusText: 'Conflict' });

    expect(failed).toBeTrue();
    // повторная загрузка списка партий и остатков
    http.expectOne(`${API}/egg-warehouse/batches`).flush([batch('b1', 'sorted'), batch('b2', 'sorted')]);
    http.expectOne(`${API}/egg-warehouse/stocks`).flush(stocks(150));
    expect(service.totalPendingRawEggs()).toBe(0);
  });
});
