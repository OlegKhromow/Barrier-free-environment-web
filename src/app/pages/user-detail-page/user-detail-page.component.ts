import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/services/security/auth.service';
import {UserDTO} from '../../core/dtos/user-dto';
import {FormsModule} from '@angular/forms';
import {Location} from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';

@Component({
  selector: 'app-user-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-detail-page.component.html',
  styleUrls: ['./user-detail-page.component.css']
})
export class UserDetailPageComponent implements OnInit {
  user: UserDTO | null = null;
  error: string | null = null;
  roles = ['ADMIN', 'USER'];
  selectedRole: string = '';
  locations: Location[] = [];
  pendingLocations: any[] = [];
  loadingLocations = false;

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private authService: AuthService,
    private locationService:LocationService
  ) {
  }

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.authService.getUserByUsername(username).subscribe({
        next: (data) => {
          this.user = data;
          this.selectedRole = data.role; // встановлюємо поточну роль
          this.locationService.loadLocationTypes();
          this.loadUserLocationsbyUsername(this.user.username);
        },
        error: (err) => {
          this.loadingLocations = false;
          console.error(err);
          this.error = err.error?.message || err.error?.error || err.message || 'Не вдалося завантажити користувача';
        }
      });
    }
  }

  loadUserLocationsbyUsername(username: string) {
    this.loadingLocations = false;

    // 1️⃣ Отримуємо обидва списки: звичайні і pending локації
    this.locationService.getUserModifiedLocationsByUsername(username).subscribe({
      next: (locations) => {
        this.locations = locations;

        this.locationService.getUserPendingLocationsByUsername(username).subscribe({
          next: (pending) => {
            this.pendingLocations = pending;
            console.log(this.pendingLocations);
            this.loadingLocations = false;
          },
          error: (err) => {
            console.error('Помилка при завантаженні pending-локацій', err);
            this.pendingLocations = [];
            this.loadingLocations = false;
          }
        });
      },
      error: (err) => {
        console.error('Помилка при завантаженні локацій користувача', err);
        this.error = 'Не вдалося отримати список локацій';
        this.loadingLocations = false;
      },
    });
  }

  ifPending(locationId: string): boolean {
    return this.pendingLocations.some(p => p.locationId === locationId);
  }

  deleteUser(): void {
    if (!this.user) return;
    if (confirm(`Видалити користувача ${this.user.username}?`)) {
      this.authService.deleteUser(this.user.username).subscribe({
        next: () => this.router.navigate(['/users']),
        error: (err) => {
          console.error(err);
          this.error = err.error?.message || err.error?.error || err.message || 'Не вдалося видалити користувача';
        }
      });
    }
  }

  changeRole(): void {
    if (!this.user) return;
    if (this.selectedRole === this.user.role) return;

    this.authService.updateUserRole(this.user.username, this.selectedRole).subscribe({
      next: () => {
        if (this.user) this.user.role = this.selectedRole;
        alert(`Роль користувача ${this.user?.username} змінена на ${this.selectedRole}`);
      },
      error: (err) => {
        console.error(err);
        this.error = err.error?.message || err.error?.error || err.message || 'Не вдалося змінити роль';
      }
    });
  }

}
