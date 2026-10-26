import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastService } from './shared/services/toast.service';
import { AuthService } from './core/auth/auth.service';
import { DemoService } from './core/api/demo.service';
import { apiErrorMessage } from './core/api/api-error';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'yield-flow-erp';
  protected readonly toastService = inject(ToastService);
  protected readonly auth = inject(AuthService);
  private readonly demoService = inject(DemoService);

  resetDemoData(): void {
    const confirmed = confirm('Сбросить все показатели фабрики к эталонным демо-данным?');
    if (!confirmed) return;

    // 1) Разделы, которые пока хранятся в браузере (их перенесёт на сервер этап 2).
    //    Ключ входа (yf_session) не трогаем, поэтому разлогинивания не будет.
    Object.keys(localStorage)
      .filter(key => key.startsWith('yieldflow_'))
      .forEach(key => localStorage.removeItem(key));

    // 2) Разделы, которые уже на сервере (птичники, склад яйца).
    this.demoService.resetServerData().subscribe({
      next: () => window.location.reload(),
      error: (error: unknown) =>
        this.toastService.show(apiErrorMessage(error, 'Не удалось сбросить данные на сервере.'), 'error')
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
