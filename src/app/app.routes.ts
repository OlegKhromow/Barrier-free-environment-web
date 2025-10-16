import { Routes } from '@angular/router';
import { MapPage } from './pages/map-page/map-page';
import { AddLocationPage } from './pages/add-location-page/add-location-page';
import { CriteriaEvaluationComponent } from './pages/criteria-evaluation/criteria-evaluation.component';
import { authGuard } from './core/services/security/auth.guard';
import {AdminPanelComponent} from './pages/admin-panel/admin-panel.component';
import {Unauthorized401Component} from './pages/unauthorized-401/unauthorized-401.component';
import {Unauthorized403Component} from './pages/unauthorized-403/unauthorized-403.component';
import {LocationsListPage} from './pages/locations-list-page/locations-list-page.component';
import {LocationDetailPage} from './pages/location-detail-page/location-detail-page.component';

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
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: 'admin/locations',
    component: LocationsListPage,
    canActivate: [authGuard],
    data: { role: 'ADMIN' }
  },
  { path: 'locations/:id', component: LocationDetailPage, canActivate: [authGuard],
    data: { role: 'ADMIN' } },
  { path: 'unauthorized-401', component: Unauthorized401Component },
  { path: 'unauthorized-403', component: Unauthorized403Component },
  {
    path: '**',
    redirectTo: 'map'
  },
];
