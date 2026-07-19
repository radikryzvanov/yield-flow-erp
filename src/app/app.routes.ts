import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'poultry',
    pathMatch: 'full'
  },
  {
    path: 'poultry',
    loadChildren: () => import('./features/poultry-management/poultry-management.routes').then(m => m.POULTRY_MANAGEMENT_ROUTES)
  }
];