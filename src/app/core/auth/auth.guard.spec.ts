import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('Защита страниц (guards)', () => {
  const isAuthenticated = signal(false);

  beforeEach(() => {
    isAuthenticated.set(false);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { isAuthenticated } }]
    });
  });

  const runAuthGuard = (url: string) =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url } as RouterStateSnapshot)
    );

  it('authGuard: без входа отправляет на /login и запоминает нужную страницу', () => {
    const result = runAuthGuard('/egg-warehouse');

    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fegg-warehouse'
    );
  });

  it('authGuard: вошедшего пускает', () => {
    isAuthenticated.set(true);

    expect(runAuthGuard('/egg-warehouse')).toBeTrue();
  });

  it('guestGuard: страницу входа показывает только невошедшим', () => {
    const run = () => TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(run()).toBeTrue();

    isAuthenticated.set(true);
    const result = run();
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/');
  });
});
