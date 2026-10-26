import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../api/api-config.token';
import { AuthService } from './auth.service';

/**
 * Перехватчик всех HTTP-запросов приложения:
 *  1) добавляет токен входа в заголовок Authorization — но только для запросов к НАШЕМУ API,
 *     чтобы токен не утёк на сторонние сайты;
 *  2) если сервер ответил 401 (токен недействителен или истёк) — выходит из системы.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const api = inject(API_CONFIG);

  const isApiRequest = req.url.startsWith(api.baseUrl);
  const token = auth.token();

  const request =
    isApiRequest && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const isLoginRequest = req.url.endsWith('/auth/login');
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isLoginRequest
      ) {
        auth.logout(router.url);
      }
      return throwError(() => error);
    })
  );
};
