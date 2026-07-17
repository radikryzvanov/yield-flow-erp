import { Provider } from '@angular/core';
import { API_CONFIG } from './api/api-config.token';

export const coreApiProviders: Provider[] = [
  {
    provide: API_CONFIG,
    useValue: {
      baseUrl: 'http://localhost:3000/api'
    }
  }
];