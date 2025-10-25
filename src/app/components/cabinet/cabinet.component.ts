import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/security/auth.service';

@Component({
  selector: 'app-cabinet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cabinet.component.html',
})
export class CabinetPageComponent implements OnInit {
  authService = inject(AuthService);

  user: any = null;
  isAdmin = false;

  ngOnInit() {
    this.authService.getByUsername().subscribe({
      next: (data) => {
        this.user = data;
        // Перевіряємо authorities
        this.authService.getAuthoritiesByUsername().subscribe({
          next: (roles) => this.isAdmin = roles.includes('ADMIN')
        });
      },
      error: (err) => console.error('Помилка при завантаженні користувача', err)
    });
  }
}
