import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastService } from './shared/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'yield-flow-erp';
  protected readonly toastService = inject(ToastService);

  resetDemoData(): void {
    const confirmed = confirm('Сбросить все показатели фабрики к эталонным демо-данным?');
    if (confirmed) {
      localStorage.clear();
      window.location.reload();
    }
  }
}