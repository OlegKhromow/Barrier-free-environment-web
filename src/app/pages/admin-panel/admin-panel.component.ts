import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {AuthService} from '../../core/services/security/auth.service';
import {catchError, of} from 'rxjs';

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
        this.router.navigate(['/unauthorized-401']);
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
        this.router.navigate(['/unauthorized-403']);
        return;
      }
      // завантажуємо дані для адмінки
      this.loadDashboardData();
    });
  }

  private loadDashboardData() {
    this.loading = true;
    this.error = null;
  }
}
