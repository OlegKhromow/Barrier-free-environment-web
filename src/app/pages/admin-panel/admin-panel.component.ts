import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/security/auth.service';
import { catchError, of } from 'rxjs';

interface CityStat {
  name: string;
  totalLocations: number;
  accessibleLocations: number;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  isAdmin = false;
  loading = true;
  error: string | null = null;

  // Данні для відображення
  cityStats: CityStat[] = [];
  pendingLocationsCount: number | null = null;
  usersCount: number | null = null;

  ngOnInit(): void {
    // Перевіряємо чи залогінений і чи адмін
    this.authService.isLoggedIn$.subscribe(isLogged => {
      if (!isLogged) {
        this.router.navigate(['/']);
        return;
      }
      this.checkAdminAndLoad();
    });
  }

  private checkAdminAndLoad() {
    this.authService.getAuthoritiesByUsername().pipe(
      catchError(err => {
        console.error('Помилка отримання ролей', err);
        this.error = 'Не вдалося отримати ролі користувача';
        return of([]);
      })
    ).subscribe((roles: string[]) => {
      this.isAdmin = Array.isArray(roles) && roles.includes('ADMIN');
      if (!this.isAdmin) {
        // якщо не адмін — відправляємо назад
        this.router.navigate(['/']);
        return;
      }
      // завантажуємо дані для адмінки
      this.loadDashboardData();
    });
  }

  private loadDashboardData() {
    this.loading = true;
    this.error = null;

    // Приклади запитів — змініть URL під ваш бекенд
    const stats$ = this.http.get<CityStat[]>(`/api/admin/stats/cities`).pipe(
      catchError(err => {
        console.warn('Не вдалося отримати статистику по містам', err);
        return of([]);
      })
    );

    const pendingCount$ = this.http.get<{ count: number}>(`/api/locations/pending/count`).pipe(
      catchError(err => {
        console.warn('Не вдалося отримати кількість pending локацій', err);
        return of({ count: 0 });
      })
    );

    const usersCount$ = this.http.get<{ count: number }>(`/api/admin/users/count`).pipe(
      catchError(err => {
        console.warn('Не вдалося отримати кількість користувачів', err);
        return of({ count: 0 });
      })
    );

    // Паралельно підписуємось (простота — без forkJoin)
    stats$.subscribe(stats => {
      this.cityStats = stats;
    });

    pendingCount$.subscribe(res => {
      this.pendingLocationsCount = res?.count ?? 0;
    });

    usersCount$.subscribe(res => {
      this.usersCount = res?.count ?? 0;
      this.loading = false;
    }, err => {
      this.loading = false;
      this.error = 'Помилка при завантаженні даних';
    });
  }

  openPendingLocationsList() {
    this.router.navigate(['/admin/locations/pending']);
  }

  openUsersList() {
    this.router.navigate(['/admin/users']);
  }

  // Простий розрахунок відсотку доступних локацій для показу в SVG chart
  accessiblePercent(stat: CityStat) {
    if (!stat.totalLocations) return 0;
    return Math.round((stat.accessibleLocations / stat.totalLocations) * 100);
  }
}
