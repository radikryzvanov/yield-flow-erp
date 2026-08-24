import { Component } from '@angular/core';
import { Routes } from '@angular/router';

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
      import('./features/poultry-management/poultry-management.routes').then(
        m => m.POULTRY_MANAGEMENT_ROUTES
      )
  },
  {
    path: 'egg-warehouse',
    loadComponent: () =>
      import('./features/poultry-management/pages/egg-warehouse/egg-warehouse.component').then(
        m => m.EggWarehouseComponent
      )
  },
  {
    path: 'feed-warehouse',
    loadComponent: () =>
      import('./features/feed-warehouse/pages/feed-dashboard/feed-dashboard.component').then(
        m => m.FeedDashboardComponent
      )
  },
  {
    path: 'incubator',
    loadComponent: () =>
      import('./features/incubator/pages/incubator-dashboard/incubator-dashboard.component').then(
        m => m.IncubatorDashboardComponent
      )
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