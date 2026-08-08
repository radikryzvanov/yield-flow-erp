import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';

import { PoultryManagementService } from '../../services/poultry-management.service';
import { PoultryHouse } from '../../interfaces/poultry-house.interface';

@Component({
  selector: 'app-poultry-list',
  standalone: true,
  imports: [],
  template: `
    <div class="poultry-container">
      <h2>Управление птицеводством</h2>
      <p class="subtitle">Список птичников и активных партий</p>

      <div class="houses-grid">
        @for (house of houses(); track house.id) {
          <div class="house-card">
            <h3>{{ house.name }}</h3>
            <p><strong>Вместимость:</strong> {{ house.capacity }} голов</p>
            <p><strong>Статус:</strong>
              <span [class.active]="house.isActive" [class.inactive]="!house.isActive">
                {{ house.isActive ? 'Активен' : 'Неактивен' }}
              </span>
            </p>
          </div>
        } @empty {
          <p>Загрузка данных или список пуст...</p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .poultry-container { padding: 20px; font-family: sans-serif; }
    .subtitle { color: #666; margin-bottom: 20px; }
    .houses-grid { display: flex; gap: 16px; flex-wrap: wrap; }
    .house-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      min-width: 220px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .house-card h3 { margin-top: 0; color: #1976d2; }
    .active { color: green; font-weight: bold; }
    .inactive { color: red; font-weight: bold; }
  `]
})
export class PoultryListComponent implements OnInit {
  private poultryService = inject(PoultryManagementService);

  houses = signal<PoultryHouse[]>([]);

  ngOnInit(): void {
    this.poultryService.getHouses().subscribe({
      next: (data) => this.houses.set(data),
      error: (err) => console.error('Ошибка загрузки птичников:', err)
    });
  }
}