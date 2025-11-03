import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/security/auth.service';
import { LocationService } from '../../core/services/location.service';
import { Location } from '../../core/models/location';
import { RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';

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
    this.loading = true;

    // 1️⃣ Спочатку перевіряємо валідність сесії
    this.authService.ensureValidSession().pipe(
      switchMap(() =>
        // 2️⃣ Якщо все ок — завантажуємо користувача
        this.authService.getByUsername()
      ),
      catchError((err) => {
        // ❌ Якщо сесія невалідна (refresh теж протух)
        console.warn('Сесія користувача невалідна:', err);
        alert('Сесія завершена. Будь ласка, увійдіть знову.');
        this.authService.openLoginModal();
        this.loading = false;
        return of(null);
      })
    ).subscribe({
      next: (data) => {
        if (!data) return; // якщо користувач не залогінений
        this.user = data;

        // 3️⃣ Отримуємо ролі
        this.authService.getAuthoritiesByUsername().subscribe({
          next: (roles) => (this.isAdmin = roles.includes('ADMIN')),
          error: (err) => console.error('Помилка при завантаженні ролей', err),
        });

        // 4️⃣ Завантажуємо типи локацій
        this.locationService.loadLocationTypes();

        // 5️⃣ Завантажуємо локації користувача
        this.loadUserLocations();
      },
      error: (err) => {
        console.error('Помилка при завантаженні користувача', err);
        this.error = 'Не вдалося отримати дані користувача';
        this.loading = false;
      },
    });
  }

  loadUserLocations() {
    this.loading = true;

    // Отримуємо обидва списки: звичайні і pending локації
    this.locationService.getUserModifiedLocations().pipe(
      switchMap((locations) => {
        this.locations = locations;
        return this.locationService.getUserPendingLocations();
      }),
      catchError((err) => {
        console.error('Помилка при завантаженні локацій користувача', err);
        this.error = 'Не вдалося отримати список локацій';
        this.loading = false;
        return of([]);
      })
    ).subscribe({
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
  }

  ifPending(locationId: string): boolean {
    return this.pendingLocations.some(p => p.locationId === locationId);
  }
}
