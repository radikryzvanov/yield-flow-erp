import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api-config.token';

@Injectable({ providedIn: 'root' })
export class DemoService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_CONFIG);

  /** Возвращает данные на сервере (птичники, склад яйца) к исходным демо-цифрам. */
  resetServerData(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api.baseUrl}/demo/reset`, {});
  }
}
