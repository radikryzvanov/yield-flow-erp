import { Routes } from '@angular/router';

export const POULTRY_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
      },
      {
        path: 'list',
        loadComponent: () => import('./pages/poultry-list/poultry-list.component').then(m => m.PoultryListComponent)
      }
    ]
  }
];