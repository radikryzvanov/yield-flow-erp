import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { API_CONFIG } from '../../../core/api/api-config.token';
import { apiErrorMessage } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly api = inject(API_CONFIG);
  private readonly destroyRef = inject(DestroyRef);

  readonly login = signal('');
  readonly password = signal('');
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Состояние сервера: бесплатный хостинг «засыпает» и просыпается около минуты. */
  readonly serverState = signal<'checking' | 'ready' | 'offline'>('checking');

  ngOnInit(): void {
    // Заранее «будим» сервер, пока человек вводит логин и пароль.
    const subscription = this.http.get(`${this.api.baseUrl}/health`).subscribe({
      next: () => this.serverState.set('ready'),
      error: () => this.serverState.set('offline')
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  submit(): void {
    if (this.isSubmitting()) return;

    const login = this.login().trim();
    const password = this.password();
    if (!login || !password) {
      this.errorMessage.set('Введите логин и пароль.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(login, password).subscribe({
      next: () => {
        void this.router.navigateByUrl(this.safeReturnUrl());
      },
      error: (error: unknown) => {
        // На странице входа 401 значит «неверный логин или пароль», а не «сессия истекла».
        const isWrongCredentials = error instanceof HttpErrorResponse && error.status === 401;
        this.errorMessage.set(
          isWrongCredentials
            ? 'Неверный логин или пароль'
            : apiErrorMessage(error, 'Не удалось войти. Попробуйте ещё раз.')
        );
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Куда перейти после входа. Принимаем только внутренние пути приложения («/egg-warehouse»),
   * иначе злоумышленник мог бы подставить в ссылку чужой сайт (атака «открытое перенаправление»).
   */
  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const isInternal = !!returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//');
    return isInternal ? returnUrl : '/';
  }
}
