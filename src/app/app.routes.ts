import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Страница входа: единственная открытая страница
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },

  // Все остальные страницы закрыты: без входа человека отправят на /login
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'poultry-management',
        pathMatch: 'full'
      },
      {
        path: 'poultry-management',
        loadComponent: () =>
          import('./features/poultry-management/pages/poultry-list/poultry-list.component').then(
            m => m.PoultryListComponent
          )
      },
      {
        path: 'elevator',
        loadComponent: () =>
          import('./features/elevator/pages/elevator-dashboard/elevator-dashboard.component').then(
            m => m.ElevatorDashboardComponent
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
        path: 'incubator',
        loadComponent: () =>
          import('./features/incubator/pages/incubator-dashboard/incubator-dashboard.component').then(
            m => m.IncubatorDashboardComponent
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
        path: 'veterinary',
        loadComponent: () =>
          import('./features/veterinary/pages/veterinary-dashboard/veterinary-dashboard.component').then(
            m => m.VeterinaryDashboardComponent
          )
      },
      {
        path: 'slaughter',
        loadComponent: () =>
          import('./features/slaughter/pages/slaughter-dashboard/slaughter-dashboard.component').then(
            m => m.SlaughterDashboardComponent
          )
      },
      {
        path: 'logistics',
        loadComponent: () =>
          import('./features/logistics/pages/routes-map/routes-map.component').then(
            m => m.RoutesMapComponent
          )
      },
      {
        path: 'finance-calc',
        loadComponent: () =>
          import('./features/finance-calc/pages/finance-dashboard/finance-dashboard.component').then(
            m => m.FinanceDashboardComponent
          )
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'poultry-management'
  }
];
