import { Routes } from '@angular/router';

export const ELEVATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/elevator-dashboard/elevator-dashboard.component').then(
        m => m.ElevatorDashboardComponent
      )
  }
];