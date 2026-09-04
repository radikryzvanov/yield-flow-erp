import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'yield-flow-erp';

  resetDemoData(): void {
    const confirmed = confirm('Сбросить все показатели фабрики к эталонным демо-данным?');
    if (confirmed) {
      localStorage.clear();
      window.location.reload();
    }
  }
}