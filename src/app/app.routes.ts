import { Routes } from '@angular/router';
import { MapPage } from './pages/map-page/map-page';
import { AddLocationPage } from './pages/add-location-page/add-location-page';
import { CriteriaEvaluationComponent } from './pages/criteria-evaluation/criteria-evaluation.component';
import { authGuard } from './core/services/security/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'map',
    pathMatch: 'full'
  },
  {
    path: 'map',
    component: MapPage
  },
  {
    path: 'add-location',
    component: AddLocationPage,
    canActivate: [authGuard]
  },
  { path: 'evaluate/:id', component: CriteriaEvaluationComponent,canActivate: [authGuard]},
  {
    path: '**',
    redirectTo: 'map'
  }
];
