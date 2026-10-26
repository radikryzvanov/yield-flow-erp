import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { API_CONFIG } from '../api/api-config.token';
import { authInterceptor } from './auth.interceptor';
import { AuthService, SESSION_STORAGE_KEY } from './auth.service';

const API = 'http://api.test/api';

describe('authInterceptor', () => {
  function setup(loggedIn: boolean) {
    if (loggedIn) {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          token: 'abc',
          user: { id: 'u1', login: 'admin', fullName: 'A', role: 'admin' },
          expiresAt: Date.now() + 60_000
        })
      );
    }
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: API } }
      ]
    });
    return {
      client: TestBed.inject(HttpClient),
      http: TestBed.inject(HttpTestingController),
      auth: TestBed.inject(AuthService)
    };
  }

  beforeEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));
  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('добавляет токен к запросам к нашему API', () => {
    const { client, http } = setup(true);

    client.get(`${API}/houses`).subscribe();

    expect(http.expectOne(`${API}/houses`).request.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('НЕ отправляет токен на сторонние сайты', () => {
    const { client, http } = setup(true);

    client.get('https://other.example.com/data').subscribe();

    expect(
      http.expectOne('https://other.example.com/data').request.headers.has('Authorization')
    ).toBeFalse();
  });

  it('не добавляет заголовок, если человек не вошёл', () => {
    const { client, http } = setup(false);

    client.get(`${API}/health`).subscribe();

    expect(http.expectOne(`${API}/health`).request.headers.has('Authorization')).toBeFalse();
  });

  it('при ответе 401 от API выходит из системы', () => {
    const { client, http, auth } = setup(true);
    const logout = spyOn(auth, 'logout');

    client.get(`${API}/houses`).subscribe({ error: () => undefined });
    http.expectOne(`${API}/houses`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
  });

  it('401 при самом входе (неверный пароль) не считается «истёкшей сессией»', () => {
    const { client, http, auth } = setup(false);
    const logout = spyOn(auth, 'logout');

    client.post(`${API}/auth/login`, {}).subscribe({ error: () => undefined });
    http.expectOne(`${API}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(logout).not.toHaveBeenCalled();
  });

  it('другие ошибки (например, 400) не разлогинивают', () => {
    const { client, http, auth } = setup(true);
    const logout = spyOn(auth, 'logout');

    client.get(`${API}/houses`).subscribe({ error: () => undefined });
    http.expectOne(`${API}/houses`).flush({}, { status: 400, statusText: 'Bad Request' });

    expect(logout).not.toHaveBeenCalled();
  });
});
