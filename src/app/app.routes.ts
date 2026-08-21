import { Component } from '@angular/core';
import { Routes } from '@angular/router';

// Временный компонент-заглушка для модулей в разработке
@Component({
  standalone: true,
  template: `
    <div style="padding: 40px; text-align: center; color: #64748b;">
      <h2 style="color: #334155;">Раздел находится в разработке</h2>
      <p>Этот производственный модуль будет подключен на следующем этапе.</p>
    </div>
  `
})
class PlaceholderComponent {}

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'poultry',
    pathMatch: 'full'
  },
  {
    path: 'poultry',
    loadChildren: () =>
      import('./features/poultry-management/poultry-management.routes').then(m => m.POULTRY_MANAGEMENT_ROUTES)
  },
  {
    path: 'incubator',
    component: PlaceholderComponent
  },
  {
    path: 'egg-warehouse',
    component: PlaceholderComponent
  },
  {
    path: 'feed-warehouse',
    component: PlaceholderComponent
  },
  {
    path: 'veterinary',
    component: PlaceholderComponent
  },
  {
    path: 'slaughter',
    component: PlaceholderComponent
  },
  {
    path: 'logistics',
    component: PlaceholderComponent
  },
  {
    path: 'finance-calc',
    component: PlaceholderComponent
  },
  {
    path: '**',
    redirectTo: 'poultry'
  }
];