import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { API_CONFIG } from '../../../core/api/api-config.token';
import { SESSION_STORAGE_KEY } from '../../../core/auth/auth.service';
import { LoginComponent } from './login.component';

const API = 'http://api.test/api';

describe('LoginComponent', () => {
  function setup(returnUrl: string | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: API } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) }
          }
        }
      ]
    });
    const fixture = TestBed.createComponent(LoginComponent);
    const http = TestBed.inject(HttpTestingController);
    const navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, http, navigateByUrl };
  }

  const fillAndSubmit = (component: LoginComponent) => {
    component.login.set('admin');
    component.password.set('secret-pass');
    component.submit();
  };

  const loginOk = {
    accessToken: 'token',
    expiresIn: 3600,
    user: { id: 'u1', login: 'admin', fullName: 'A', role: 'admin' }
  };

  beforeEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));
  afterEach(() => localStorage.removeItem(SESSION_STORAGE_KEY));

  it('при открытии «будит» сервер запросом /health и показывает, что он готов', () => {
    const { component, http } = setup(null);
    expect(component.serverState()).toBe('checking');

    http.expectOne(`${API}/health`).flush({ status: 'ok' });

    expect(component.serverState()).toBe('ready');
  });

  it('не отправляет форму с пустыми полями', () => {
    const { component, http } = setup(null);
    http.expectOne(`${API}/health`).flush({ status: 'ok' });

    component.submit();

    http.expectNone(`${API}/auth/login`);
    expect(component.errorMessage()).toBe('Введите логин и пароль.');
  });

  it('после входа переходит на страницу, куда человек шёл', () => {
    const { component, http, navigateByUrl } = setup('/egg-warehouse');
    http.expectOne(`${API}/health`).flush({});

    fillAndSubmit(component);
    http.expectOne(`${API}/auth/login`).flush(loginOk);

    expect(navigateByUrl).toHaveBeenCalledWith('/egg-warehouse');
  });

  it('защита от подмены адреса: чужой сайт в returnUrl игнорируется', () => {
    for (const evil of ['//evil.example.com', 'https://evil.example.com', 'javascript:alert(1)']) {
      TestBed.resetTestingModule();
      localStorage.removeItem(SESSION_STORAGE_KEY);
      const { component, http, navigateByUrl } = setup(evil);
      http.expectOne(`${API}/health`).flush({});

      fillAndSubmit(component);
      http.expectOne(`${API}/auth/login`).flush(loginOk);

      expect(navigateByUrl).toHaveBeenCalledWith('/');
    }
  });

  it('при неверном пароле показывает ошибку и снова включает кнопку', () => {
    const { component, http, navigateByUrl } = setup(null);
    http.expectOne(`${API}/health`).flush({});

    fillAndSubmit(component);
    expect(component.isSubmitting()).toBeTrue();
    http
      .expectOne(`${API}/auth/login`)
      .flush({ message: 'Неверный логин или пароль' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.errorMessage()).toBe('Неверный логин или пароль');
    expect(component.isSubmitting()).toBeFalse();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
