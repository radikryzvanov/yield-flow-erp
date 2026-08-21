import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PoultryManagementService } from '../../services/poultry-management.service';
import { PoultryHouse } from '../../interfaces/poultry-house.interface';
import { PoultryBatch } from '../../interfaces/poultry-batch.interface';
import { PoultryDailyLog } from '../../interfaces/poultry-daily-log.interface';

export interface HouseWithBatch extends PoultryHouse {
  activeBatch?: PoultryBatch;
}

@Component({
  selector: 'app-poultry-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="poultry-container">
      <h2>Управление птицеводством</h2>
      <p class="subtitle">Список птичников и оперативный суточный журнал</p>

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

              <button class="btn-primary" (click)="openLogModal(house)">
                + Внести данные за смену
              </button>
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

      <!-- Модальное окно суточного отчета Бригадира -->
      @if (selectedHouse(); as targetHouse) {
        <div class="modal-backdrop">
          <div class="modal-content">
            <h3>Суточный отчет: {{ targetHouse.name }}</h3>
            <p class="modal-subtitle">Партия: {{ targetHouse.activeBatch?.batchNumber }}</p>

            <form (ngSubmit)="saveDailyLog()">
              <div class="form-group">
                <label>Дата смены:</label>
                <input type="date" [(ngModel)]="logForm.date" name="date" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Падёж (голов):</label>
                  <input type="number" min="0" [(ngModel)]="logForm.mortalityCount" name="mortality" required />
                </div>
                <div class="form-group">
                  <label>Выбраковка (голов):</label>
                  <input type="number" min="0" [(ngModel)]="logForm.cullingCount" name="culling" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Сбор яйца (штук):</label>
                  <input type="number" min="0" [(ngModel)]="logForm.eggCount" name="eggCount" />
                </div>
                <div class="form-group">
                  <label>Расход корма (кг):</label>
                  <input type="number" min="0" [(ngModel)]="logForm.feedConsumedKg" name="feedConsumedKg" required />
                </div>
              </div>

              <div class="form-group">
                <label>Примечание / Заметки:</label>
                <textarea rows="2" [(ngModel)]="logForm.notes" name="notes" placeholder="Температура, влажность или состояние птицы"></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" (click)="closeLogModal()">Отмена</button>
                <button type="submit" class="btn-submit">Сохранить запись</button>
              </div>
            </form>
          </div>
        </div>
      }
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
      min-width: 280px;
      max-width: 320px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-header h3 { margin: 0; color: #1976d2; font-size: 1.1rem; }
    .active { color: #2e7d32; font-weight: bold; font-size: 0.85rem; }
    .inactive { color: #d32f2f; font-weight: bold; font-size: 0.85rem; }
    .divider { border: 0; border-top: 1px solid #f0f0f0; margin: 12px 0; }
    .batch-info p { margin: 4px 0; font-size: 0.9rem; }
    .batch-empty { color: #888; font-style: italic; font-size: 0.85rem; padding: 20px 0; }
    .empty-house { background-color: #fafafa; }

    .btn-primary {
      margin-top: 12px;
      padding: 8px 12px;
      background-color: #1976d2;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-primary:hover { background-color: #1565c0; }

    /* Стили модального окна */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      display: flex; justify-content: center; align-items: center; z-index: 1000;
    }
    .modal-content {
      background: #fff; border-radius: 8px; padding: 24px;
      width: 100%; max-width: 440px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    }
    .modal-subtitle { margin-top: -8px; color: #666; font-size: 0.9rem; margin-bottom: 16px; }
    .form-group { margin-bottom: 12px; display: flex; flex-direction: column; }
    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }
    label { font-size: 0.85rem; font-weight: bold; margin-bottom: 4px; color: #333; }
    input, textarea {
      padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;
    }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .btn-cancel { padding: 8px 16px; background: #eee; border: none; border-radius: 4px; cursor: pointer; }
    .btn-submit { padding: 8px 16px; background: #2e7d32; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    .btn-submit:hover { background: #1b5e20; }
  `]
})
export class PoultryListComponent implements OnInit {
  private poultryService = inject(PoultryManagementService);

  houses = signal<HouseWithBatch[]>([]);
  selectedHouse = signal<HouseWithBatch | null>(null);

  logForm = {
    date: new Date().toISOString().substring(0, 10),
    mortalityCount: 0,
    cullingCount: 0,
    eggCount: 0,
    feedConsumedKg: 0,
    notes: ''
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
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

  openLogModal(house: HouseWithBatch): void {
    this.selectedHouse.set(house);
    this.logForm = {
      date: new Date().toISOString().substring(0, 10),
      mortalityCount: 0,
      cullingCount: 0,
      eggCount: 0,
      feedConsumedKg: 0,
      notes: ''
    };
  }

  closeLogModal(): void {
    this.selectedHouse.set(null);
  }

  saveDailyLog(): void {
    const currentSelected = this.selectedHouse();
    if (!currentSelected || !currentSelected.activeBatch) return;

    this.poultryService.addDailyLog({
      batchId: currentSelected.activeBatch.id,
      houseId: currentSelected.id,
      date: this.logForm.date,
      mortalityCount: Number(this.logForm.mortalityCount),
      cullingCount: Number(this.logForm.cullingCount),
      eggCount: Number(this.logForm.eggCount),
      feedConsumedKg: Number(this.logForm.feedConsumedKg),
      notes: this.logForm.notes
    }).subscribe(() => {
      this.closeLogModal();
      this.loadData(); // Обновляем данные на экране (поголовье уменьшится на падёж)
    });
  }
}