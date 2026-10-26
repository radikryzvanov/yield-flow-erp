import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, forkJoin, map, switchMap, tap } from 'rxjs';
import { API_CONFIG } from '../../../core/api/api-config.token';
import { AuthService } from '../../../core/auth/auth.service';
import { IncomingEggBatch, EggStock } from '../interfaces/egg-warehouse.interface';

/** Партия яйца в том виде, как её присылает сервер. */
interface EggBatchDto {
  id: string;
  houseName: string;
  rawEggCount: number;
  status: 'pending' | 'sorted';
  receivedAt: string;
}

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

/** Сервер присылает точное время (ISO); для таблицы переводим в «26.10, 18:30». */
function toIncomingBatch(dto: EggBatchDto): IncomingEggBatch {
  return {
    id: dto.id,
    houseName: dto.houseName,
    rawEggCount: dto.rawEggCount,
    date: dateFormatter.format(new Date(dto.receivedAt)),
    status: dto.status
  };
}

/**
 * Склад яйца. Источник правды — сервер: он же выполняет сортировку
 * (в одной транзакции, с защитой от двойного нажатия).
 */
@Injectable({
  providedIn: 'root'
})
export class EggWarehouseService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_CONFIG);
  private readonly auth = inject(AuthService);

  private readonly _incomingBatches = signal<IncomingEggBatch[]>([]);
  private readonly _stocks = signal<EggStock[]>([]);

  readonly incomingBatches = this._incomingBatches.asReadonly();
  readonly stocks = this._stocks.asReadonly();

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        untracked(() => this.refresh());
      } else {
        untracked(() => {
          this._incomingBatches.set([]);
          this._stocks.set([]);
        });
      }
    });
  }

  /** Загрузить партии и остатки с сервера. */
  refresh(): void {
    forkJoin({
      batches: this.http.get<EggBatchDto[]>(`${this.api.baseUrl}/egg-warehouse/batches`),
      stocks: this.http.get<EggStock[]>(`${this.api.baseUrl}/egg-warehouse/stocks`)
    }).subscribe({
      next: ({ batches, stocks }) => {
        this._incomingBatches.set(batches.map(toIncomingBatch));
        this._stocks.set(stocks);
      },
      error: () => {
        // Ошибка загрузки: на экране останутся прежние данные; причину увидит перехватчик/консоль.
      }
    });
  }

  // Всего рассортированного товарного яйца
  readonly totalStockEggs = computed(() =>
    this._stocks().reduce((sum, s) => sum + s.count, 0)
  );

  // Объем яйца, ожидающего сортировки
  readonly totalPendingRawEggs = computed(() =>
    this._incomingBatches()
      .filter(b => b.status === 'pending')
      .reduce((sum, b) => sum + b.rawEggCount, 0)
  );

  /** Приёмка валового яйца из птичника (по id птичника). */
  registerIncomingEggs(houseId: string, eggCount: number): Observable<IncomingEggBatch> {
    return this.http
      .post<EggBatchDto>(`${this.api.baseUrl}/egg-warehouse/batches`, {
        houseId,
        rawEggCount: eggCount
      })
      .pipe(
        map(toIncomingBatch),
        tap(batch => this._incomingBatches.update(batches => [batch, ...batches]))
      );
  }

  /** Сортировка партии: сервер раскладывает яйцо по категориям и пополняет остатки. */
  sortBatch(batchId: string): Observable<void> {
    return this.http
      .post<EggBatchDto>(`${this.api.baseUrl}/egg-warehouse/batches/${batchId}/sort`, {})
      .pipe(
        tap(dto =>
          this._incomingBatches.update(batches =>
            batches.map(b => (b.id === dto.id ? toIncomingBatch(dto) : b))
          )
        ),
        switchMap(() => this.http.get<EggStock[]>(`${this.api.baseUrl}/egg-warehouse/stocks`)),
        tap(stocks => this._stocks.set(stocks)),
        map(() => undefined),
        tap({
          error: (error: { status?: number }) => {
            // 409: партию уже рассортировали (например, на другом экране) — обновляем данные.
            if (error?.status === 409) this.refresh();
          }
        })
      );
  }
}
