import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_CONFIG } from '../../../core/api/api-config.token';
import { apiErrorMessage } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';

export interface PoultryHouse {
  id: string;
  name: string;
  birdType: 'layer' | 'broiler' | 'rearing';
  crossType: string;
  ageDays: number;
  status: 'active' | 'quarantine' | 'cleaning';
  birdCount: number;
  initialBirdCount: number;
  dailyEggCount: number;
  actualLayingRatePercent: number;
  targetLayingRatePercent: number;
  feedPerBirdGrams: number;
  targetFeedGrams: number;
  temperature: number;
  targetTemperature: number;
  humidityPercent: number;
  [key: string]: any;
}

/** Суточный отчёт: именно эти поля принимает сервер. */
export interface DailyReportInput {
  houseId: string;
  eggCount: number;
  mortalityCount?: number;
  feedPerBirdGrams?: number;
  temperature?: number;
  humidityPercent?: number;
}

/**
 * Данные птичников. Источник правды — сервер (API); здесь они хранятся в сигнале,
 * чтобы экраны мгновенно обновлялись. Публичные названия (houses, totalBirds ...)
 * остались прежними, поэтому другие разделы продолжают работать без изменений.
 */
@Injectable({
  providedIn: 'root'
})
export class PoultryManagementService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_CONFIG);
  private readonly auth = inject(AuthService);

  private readonly _houses = signal<PoultryHouse[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _loadError = signal<string | null>(null);

  readonly houses = this._houses.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadError = this._loadError.asReadonly();

  constructor() {
    // Когда человек вошёл — загружаем данные; когда вышел — очищаем (чужие данные не остаются в памяти).
    effect(() => {
      if (this.auth.isAuthenticated()) {
        untracked(() => this.refresh());
      } else {
        untracked(() => this._houses.set([]));
      }
    });
  }

  /** Загрузить список птичников с сервера. */
  refresh(): void {
    this._loading.set(true);
    this._loadError.set(null);

    this.http.get<PoultryHouse[]>(`${this.api.baseUrl}/houses`).subscribe({
      next: houses => {
        this._houses.set(houses);
        this._loading.set(false);
      },
      error: (error: unknown) => {
        this._loadError.set(apiErrorMessage(error, 'Не удалось загрузить птичники.'));
        this._loading.set(false);
      }
    });
  }

  // Сигналы, которые требует PoultryListComponent
  readonly totalBirds = computed(() =>
    this._houses().reduce((sum, h) => sum + h.birdCount, 0)
  );

  // Сигналы, которые требуют PoultryListComponent и FinanceService
  readonly totalDailyEggs = computed(() =>
    this._houses().reduce((sum, h) => sum + h.dailyEggCount, 0)
  );

  readonly totalDailyFeedTons = computed(() => {
    const totalKg = this._houses().reduce(
      (sum, h) => sum + (h.birdCount * h.feedPerBirdGrams) / 1000,
      0
    );
    return +(totalKg / 1000).toFixed(1);
  });

  readonly averageLayingRate = computed(() => {
    const layers = this._houses().filter(h => h.birdType === 'layer');
    if (layers.length === 0) return 0;
    const avg = layers.reduce((sum, h) => sum + h.actualLayingRatePercent, 0) / layers.length;
    return +avg.toFixed(1);
  });

  /** Приём выведенного суточного молодняка из инкубатория. */
  receiveNewFlock(houseId: string, birdsCount: number): Observable<PoultryHouse> {
    return this.http
      .post<PoultryHouse>(`${this.api.baseUrl}/houses/${houseId}/receive-flock`, { birdsCount })
      .pipe(tap(updated => this.replaceHouse(updated)));
  }

  /** Убытие птицы из птичника (например, отправка на убой). Сбор яиц не затрагивается. */
  removeBirds(houseId: string, birdsCount: number): Observable<PoultryHouse> {
    return this.http
      .post<PoultryHouse>(`${this.api.baseUrl}/houses/${houseId}/remove-birds`, { birdsCount })
      .pipe(tap(updated => this.replaceHouse(updated)));
  }

  /** Суточный отчёт зоотехника. Сервер пересчитывает поголовье и яйценоскость. */
  submitDailyReport(report: DailyReportInput): Observable<PoultryHouse> {
    const { houseId, ...body } = report;
    return this.http
      .post<PoultryHouse>(`${this.api.baseUrl}/houses/${houseId}/daily-reports`, body)
      .pipe(tap(updated => this.replaceHouse(updated)));
  }

  private replaceHouse(updated: PoultryHouse): void {
    this._houses.update(houses => houses.map(h => (h.id === updated.id ? updated : h)));
  }
}
