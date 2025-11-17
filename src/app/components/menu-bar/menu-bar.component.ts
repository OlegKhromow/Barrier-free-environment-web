import {Component, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/services/security/auth.service';
import {NgOptimizedImage} from '@angular/common';
import {SearchBarComponent} from '../search-bar/search-bar.component';
import {LanguageSwitcherComponent} from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [
    RouterLink,
    NgOptimizedImage,
    SearchBarComponent,
    LanguageSwitcherComponent
  ],
  templateUrl: './menu-bar.component.html',
  styleUrl: './menu-bar.component.css'
})
export class MenuBarComponent implements OnInit {
  router = inject(Router);
  isOpen = false;
  isLogin = false;
  isAdmin = false;
  language: 'ua' | 'en' = 'ua';

  authService: AuthService = inject(AuthService);

  menuItems = [
    {label: 'Карта', link: '/map', show: () => true},
    {label: 'Про проєкт', link: '/about', show: () => true},
    {label: 'Адмін-панель', link: '/admin', show: () => this.isAdmin},
  ];

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

  onSearch(query: string) {
    console.log('Шукаємо:', query);
  }

  setLanguage(lang: 'ua' | 'en') {
    this.language = lang;
    // todo add localization logic
  }
}
