import { Component,inject, OnInit } from '@angular/core';
import{ AuthService } from '../../core/services/security/auth.service';
import { UserService } from '../../core/services/user-service';
import { UserStatistics } from '../../core/dtos/user-scope/user-statistics';

@Component({
  selector: 'app-profile-component',
  imports: [],
  templateUrl: './profile-component.html',
  styleUrl: './profile-component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);

  isAdmin = false;
  user: any = null;

  statistics: UserStatistics | null = null;   // ← додаємо поле

  ngOnInit() {
    this.authService.getByUsername().subscribe({
      next: (data) => {
        this.user = data;

        this.authService.getAuthoritiesByUsername().subscribe({
          next: (roles) => (this.isAdmin = roles.includes('ADMIN'))
        });

        this.userService.getUserStatistics().subscribe({
          next: (stats) => {
            this.statistics = stats;
          }
        });

      }
    });
  }
}

