import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { API_CONFIG } from '../api/api-config.token';
import { AuthService, SESSION_STORAGE_KEY } from './auth.service';

const API = 'http://api.test/api';
const USER = { id: 'u1', login: 'admin', fullName: 'Администратор', role: 'admin' };

describe('AuthService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: API } }
      ]
    });
    return {
      service: TestBed.inject(AuthService),
      http: TestBed.inject(HttpTestingController),
      router: TestBed.inject(Router)
    };
  }

  beforeEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));
  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('в начале пользователь не вошёл', () => {
    const { service } = setup();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
  });

  it('после успешного входа хранит токен и пользователя и сохраняет их в localStorage', () => {
    const { service, http } = setup();

    service.login('admin', 'secret-pass').subscribe();
    const req = http.expectOne(`${API}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ login: 'admin', password: 'secret-pass' });
    req.flush({ accessToken: 'token-123', expiresIn: 3600, user: USER });

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe('token-123');
    expect(service.user()?.login).toBe('admin');
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!).token).toBe('token-123');
  });

  it('при неверном пароле (401) вход не создаётся', () => {
    const { service, http } = setup();
    let status = 0;

    service.login('admin', 'wrong').subscribe({ error: e => (status = e.status) });
    http
      .expectOne(`${API}/auth/login`)
      .flush({ message: 'Неверный логин или пароль' }, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('восстанавливает вход из localStorage после перезагрузки страницы', () => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: 'saved', user: USER, expiresAt: Date.now() + 60_000 })
    );
    const { service } = setup();

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token()).toBe('saved');
  });

  it('не восстанавливает просроченный вход', () => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: 'old', user: USER, expiresAt: Date.now() - 1000 })
    );
    const { service } = setup();

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('не падает, если в localStorage лежит мусор', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, '{не json');
    const { service } = setup();

    expect(service.isAuthenticated()).toBeFalse();
  });

  it('выход очищает вход и отправляет на страницу /login', () => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: 'saved', user: USER, expiresAt: Date.now() + 60_000 })
    );
    const { service, router } = setup();
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    service.logout('/egg-warehouse');

    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/egg-warehouse' }
    });
  });
});
