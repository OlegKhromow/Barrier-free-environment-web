import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/services/security/auth.service';

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.css'
})
export class MenuBarComponent implements OnInit {
  router = inject(Router);
  isOpen = false;
  isLogin = false;
  isAdmin = false;

  authService: AuthService = inject(AuthService);

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(isLogged => {
      this.isLogin = isLogged;
      if (isLogged) {
        this.checkAdmin();
      } else {
        this.isAdmin = false;
      }
    });
  }

  checkAdmin() {
    this.authService.getAuthoritiesByUsername().subscribe({
      next: (roles: string[]) => {
        this.isAdmin = roles.includes('ADMIN');
      },
      error: (err) => {
        console.error('Помилка при отриманні ролей користувача', err);
      }
    });
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  openLogin() {
    this.authService.openLoginModal();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
