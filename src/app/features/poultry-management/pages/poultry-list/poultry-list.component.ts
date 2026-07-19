import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-poultry-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="poultry-container">
      <h2>Управление птицеводством</h2>
      <p>Список птичников и активных партий</p>
    </div>
  `,
  styles: [`
    .poultry-container {
      padding: 20px;
    }
  `]
})
export class PoultryListComponent {}