import {Routes} from '@angular/router';
import {MapPage} from './pages/map-page/map-page';
import {CriteriaEvaluationComponent} from './pages/criteria-evaluation/criteria-evaluation.component';
import {authGuard} from './core/services/security/auth.guard';
import {AdminPanelComponent} from './pages/admin-panel/admin-panel.component';
import {Unauthorized401Component} from './pages/unauthorized-401/unauthorized-401.component';
import {Unauthorized403Component} from './pages/unauthorized-403/unauthorized-403.component';
import {LocationsListPage} from './pages/locations-list-page/locations-list-page.component';
import {LocationDetailPage} from './pages/location-detail-page/location-detail-page.component';
import {UserLocationPageComponent} from './pages/user-location-page/user-location-page.component';
import {UserListPageComponent} from './pages/user-list-page/user-list-page.component';
import {UserDetailPageComponent} from './pages/user-detail-page/user-detail-page.component';
import {ProfileComponent} from './components/profile-component/profile-component';
import {SettingsComponent} from './components/settings-component/settings-component';
import {
  LocationCabinetListComponent
} from './components/location-cabinet-list-component/location-cabinet-list-component';
import {CabinetV2} from './pages/cabinet-v2/cabinet-v2';

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
  {path: 'evaluate/:id', component: CriteriaEvaluationComponent, canActivate: [authGuard]},

  {
    path: 'cabinet',
    component: CabinetV2,
    canActivate: [authGuard],
    children: [
      {path: 'profile', component: ProfileComponent}, // створіть компонент профілю
      {path: 'locations', component: LocationCabinetListComponent}, // це буде список локацій користувача
      {path: 'settings', component: SettingsComponent}, // компонент налаштувань
      {path: '', redirectTo: 'profile', pathMatch: 'full'}
    ]
  },


  {
    path: 'admin',
    component: AdminPanelComponent,
    canActivate: [authGuard],
    data: {role: 'ADMIN'}
  },
  {
    path: 'admin/locations',
    component: LocationsListPage,
    canActivate: [authGuard],
    data: {role: 'ADMIN'}
  },
  {
    path: 'locations/:id', component: LocationDetailPage, canActivate: [authGuard],
    data: {role: 'ADMIN'}
  },
  {
    path: 'users', component: UserListPageComponent, canActivate: [authGuard],
    data: {role: 'ADMIN'}
  },
  {
    path: 'users/:username', component: UserDetailPageComponent, canActivate: [authGuard],
    data: {role: 'ADMIN'}
  },
  {path: 'user-location/:id', component: UserLocationPageComponent, canActivate: [authGuard]},
  {path: 'unauthorized-401', component: Unauthorized401Component},
  {path: 'unauthorized-403', component: Unauthorized403Component},
  {
    path: '**',
    redirectTo: 'map'
  },
];
