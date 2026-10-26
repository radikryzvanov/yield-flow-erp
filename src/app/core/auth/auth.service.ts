import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_CONFIG } from '../api/api-config.token';

/** Пользователь, как его возвращает сервер (без пароля). */
export interface AuthUser {
  id: string;
  login: string;
  fullName: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  /** Через сколько секунд токен перестанет действовать. */
  expiresIn: number;
  user: AuthUser;
}

interface Session {
  token: string;
  user: AuthUser;
  /** Момент окончания действия токена (миллисекунды). */
  expiresAt: number;
}

/** Ключ в localStorage. Не начинается с «yieldflow_», чтобы «Сброс демо-данных» не разлогинивал. */
export const SESSION_STORAGE_KEY = 'yf_session';

/**
 * Хранение входа. Токен лежит в localStorage — это просто и переживает перезагрузку страницы,
 * но доступно скриптам страницы (риск при XSS-атаке). Более защищённый вариант —
 * httpOnly-cookie, он потребует доработки сервера.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_CONFIG);
  private readonly router = inject(Router);

  private readonly _session = signal<Session | null>(readStoredSession());

  readonly user = computed(() => this._session()?.user ?? null);
  readonly token = computed(() => this._session()?.token ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null);

  /** Вход по логину и паролю. Ошибку (например, 401) получает вызывающий код. */
  login(login: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api.baseUrl}/auth/login`, { login, password })
      .pipe(
        tap(response => {
          const session: Session = {
            token: response.accessToken,
            user: response.user,
            expiresAt: Date.now() + response.expiresIn * 1000
          };
          this._session.set(session);
          storeSession(session);
        })
      );
  }

  /** Выход: забываем токен и возвращаемся на страницу входа. */
  logout(returnUrl?: string): void {
    this._session.set(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // хранилище недоступно — ничего страшного, сессия в памяти уже сброшена
    }
    void this.router.navigate(['/login'], {
      queryParams: returnUrl && returnUrl !== '/login' ? { returnUrl } : undefined
    });
  }
}

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    const valid =
      typeof session.token === 'string' &&
      typeof session.expiresAt === 'number' &&
      session.expiresAt > Date.now() &&
      !!session.user;
    if (!valid) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function storeSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // без хранилища вход будет жить только до перезагрузки страницы
  }
}
