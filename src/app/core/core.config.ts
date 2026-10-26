import { Provider } from '@angular/core';
import { environment } from '../../environments/environment';
import { API_CONFIG } from './api/api-config.token';

export const coreApiProviders: Provider[] = [
  {
    provide: API_CONFIG,
    useValue: {
      // При `ng serve` подставляется адрес из environment.development.ts
      baseUrl: environment.apiUrl
    }
  }
];
