import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/api/api-config.token';
import { PoultryHouse } from '../interfaces/poultry-house.interface';
import { PoultryBatch } from '../interfaces/poultry-batch.interface';

@Injectable({
  providedIn: 'root'
})
export class PoultryManagementService {
  private readonly baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_CONFIG) config: ApiConfig
  ) {
    this.baseUrl = config.baseUrl;
  }

  getHouses(): Observable<PoultryHouse[]> {
    return this.http.get<PoultryHouse[]>(`${this.baseUrl}/poultry-houses`);
  }

  getBatches(): Observable<PoultryBatch[]> {
    return this.http.get<PoultryBatch[]>(`${this.baseUrl}/poultry-batches`);
  }
}