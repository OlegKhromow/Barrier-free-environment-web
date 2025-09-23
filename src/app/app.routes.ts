import { Routes } from '@angular/router';
import {MapPage} from './pages/map-page/map-page';
import {authGuard} from './core/services/security/auth.guard';
import {AddLocationPage} from './pages/add-location-page/add-location-page';

export const routes: Routes = [
  {path: 'map', component: MapPage},
  {path: 'add-location', component: AddLocationPage, canActivate: [authGuard]}
];
