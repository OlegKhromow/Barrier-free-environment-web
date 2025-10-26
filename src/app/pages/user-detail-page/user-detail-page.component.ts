import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/security/auth.service';
import { UserDTO } from '../../core/dtos/user-dto';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-detail-page.component.html',
  styleUrls: ['./user-detail-page.component.css']
})
export class UserDetailPageComponent implements OnInit {
  user: UserDTO | null = null;
  error: string | null = null;
  roles = ['ADMIN', 'USER'];
  selectedRole: string = '';

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const username = this.route.snapshot.paramMap.get('username');
    if (username) {
      this.authService.getUserByUsername(username).subscribe({
        next: (data) => {
          this.user = data;
          this.selectedRole = data.role; // встановлюємо поточну роль
        },
        error: (err) => {
          console.error(err);
          this.error = err.error?.message || err.error?.error || err.message || 'Не вдалося завантажити користувача';
        }      });
    }
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
