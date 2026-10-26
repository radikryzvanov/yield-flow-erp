import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { routes } from './app.routes';
import { coreApiProviders } from './core/core.config';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // authInterceptor добавляет токен входа ко всем запросам к нашему API
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    ...coreApiProviders // <--- Распаковываем наши готовые API-провайдеры
  ]
};
