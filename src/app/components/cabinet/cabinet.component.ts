import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/security/auth.service';
import { LocationService } from '../../core/services/location.service';
import { Location } from '../../core/models/location';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-cabinet',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cabinet.component.html',
})
export class CabinetPageComponent implements OnInit {
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  user: any = null;
  isAdmin = false;
  locations: Location[] = [];
  pendingLocations: any[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.authService.getByUsername().subscribe({
      next: (data) => {
        this.user = data;

        this.authService.getAuthoritiesByUsername().subscribe({
          next: (roles) => (this.isAdmin = roles.includes('ADMIN'))
        });

        this.locationService.loadLocationTypes();
        this.loadUserLocations();
      },
      error: (err) => {
        console.error('Помилка при завантаженні користувача', err);
        this.error = 'Не вдалося отримати дані користувача';
        this.loading = false;
      }
    });
  }

  loadUserLocations() {
    this.loading = true;

    // 1️⃣ Отримуємо обидва списки: звичайні і pending локації
    this.locationService.getUserModifiedLocations().subscribe({
      next: (locations) => {
        this.locations = locations;

        this.locationService.getUserPendingLocations().subscribe({
          next: (pending) => {
            this.pendingLocations = pending;
            console.log(this.pendingLocations);
            this.loading = false;
          },
          error: (err) => {
            console.error('Помилка при завантаженні pending-локацій', err);
            this.pendingLocations = [];
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Помилка при завантаженні локацій користувача', err);
        this.error = 'Не вдалося отримати список локацій';
        this.loading = false;
      },
    });
  }

  ifPending(locationId: string): boolean {
    return this.pendingLocations.some(p => p.locationId === locationId);
  }

}
