import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { API_CONFIG } from './core/api/api-config.token';
import { AuthService } from './core/auth/auth.service';
import { ToastService } from './shared/services/toast.service';

describe('AppComponent', () => {
  const isAuthenticated = signal(false);
  const user = signal<{ fullName: string; login: string } | null>(null);

  beforeEach(async () => {
    isAuthenticated.set(false);
    user.set(null);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: 'http://api.test/api' } },
        { provide: AuthService, useValue: { isAuthenticated, user, logout: () => undefined } },
        ToastService
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('боковое меню скрыто, пока человек не вошёл', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar')).toBeNull();
  });

  it('после входа показывает меню и имя пользователя', () => {
    isAuthenticated.set(true);
    user.set({ fullName: 'Администратор', login: 'admin' });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const sidebar: HTMLElement = fixture.nativeElement.querySelector('.sidebar');
    expect(sidebar).not.toBeNull();
    expect(sidebar.textContent).toContain('Администратор');
    expect(sidebar.textContent).toContain('Выйти');
  });
});
