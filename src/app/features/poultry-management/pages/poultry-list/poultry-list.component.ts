import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { PoultryManagementService } from '../../services/poultry-management.service';
import { PoultryHouse } from '../../interfaces/poultry-house.interface';
import { PoultryBatch } from '../../interfaces/poultry-batch.interface';

// Интерфейс для удобного отображения корпуса вместе с партией
export interface HouseWithBatch extends PoultryHouse {
  activeBatch?: PoultryBatch;
}

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
          <div class="house-card" [class.empty-house]="!house.activeBatch">
            <div class="card-header">
              <h3>{{ house.name }}</h3>
              <span [class.active]="house.isActive" [class.inactive]="!house.isActive">
                {{ house.isActive ? 'Активен' : 'Неактивен' }}
              </span>
            </div>

            <p><strong>Вместимость:</strong> {{ house.capacity }} голов</p>

            <hr class="divider" />

            @if (house.activeBatch) {
              <div class="batch-info">
                <p><strong>Партия:</strong> {{ house.activeBatch.batchNumber }}</p>
                <p><strong>Поголовье:</strong> {{ house.activeBatch.currentCount }} / {{ house.activeBatch.initialCount }} голов</p>
                <p><strong>Посадка:</strong> {{ house.activeBatch.placementDate }}</p>
              </div>
            } @else {
              <div class="batch-empty">
                <p>Нет активной партии (корпус свободен)</p>
              </div>
            }
          </div>
        } @empty {
          <p>Загрузка данных или список пуст...</p>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .poultry-container { padding: 20px; font-family: sans-serif; }
    .subtitle { color: #666; margin-bottom: 20px; }
    .houses-grid { display: flex; gap: 16px; flex-wrap: wrap; }
    .house-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      min-width: 260px;
      max-width: 320px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      background-color: #ffffff;
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-header h3 { margin: 0; color: #1976d2; font-size: 1.1rem; }
    .active { color: #2e7d32; font-weight: bold; font-size: 0.85rem; }
    .inactive { color: #d32f2f; font-weight: bold; font-size: 0.85rem; }
    .divider { border: 0; border-top: 1px solid #f0f0f0; margin: 12px 0; }
    .batch-info p { margin: 4px 0; font-size: 0.9rem; }
    .batch-empty { color: #888; font-style: italic; font-size: 0.85rem; }
    .empty-house { background-color: #fafafa; }
  `]
})
export class PoultryListComponent implements OnInit {
  private poultryService = inject(PoultryManagementService);

  houses = signal<HouseWithBatch[]>([]);

  ngOnInit(): void {
    // Получаем одновременно птичники и партии
    this.poultryService.getHouses().subscribe(houses => {
      this.poultryService.getBatches().subscribe(batches => {
        const combined = houses.map(house => ({
          ...house,
          activeBatch: batches.find(b => b.houseId === house.id && b.status === 'active')
        }));
        this.houses.set(combined);
      });
    });
  }
}