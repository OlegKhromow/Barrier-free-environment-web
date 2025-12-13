import {Component, inject, Input, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {AuthService} from '../../core/services/security/auth.service';
import {NgOptimizedImage} from '@angular/common';
import {SearchBarComponent} from '../search-bar/search-bar.component';
import {LanguageSwitcherComponent} from '../language-switcher/language-switcher.component';
import {filter} from 'rxjs';
import {Location} from '../../core/models/location';
import {LocationStore} from '../../core/stores/LocationStore';

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
  isOpen = false;
  isLogin = false;
  isAdmin = false;
  showSearchBar = false;
  language: 'ua' | 'en' = 'ua';


  @Input() locations: Location[] | null = null;

  query = '';
  filtered: Location[] = [];

  onSearch(query: string) {
    this.query = query;

    if (!this.locations || !query.trim()) {
      this.filtered = [];
      return;
    }

    const q = query.toLowerCase();

    this.filtered = this.locations
      .filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.type?.name?.toLowerCase().includes(q)||
        l.address?.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }

  selectLocation(loc: Location) {
    this.filtered = [];

    this.router.navigate(['/map'], {
      queryParams: {
        flyToLat: loc.latitude,
        flyToLng: loc.longitude,
        selectedId: loc.id
      }
    });
  }


authService: AuthService = inject(AuthService);

  menuItems = [
    {label: 'Карта', link: '/map', show: () => true},
    {label: 'Про проєкт', link: '/about', show: () => true},
    {label: 'Адмін-панель', link: '/admin', show: () => this.isAdmin},
  ];

  constructor(private router: Router, private locationStore: LocationStore) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showSearchBar = event.url.includes('/map');
      });
  }

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(isLogged => {
      this.isLogin = isLogged;
      if (isLogged) {
        this.checkAdmin();
      } else {
        this.isAdmin = false;
      }
    });
    this.locationStore.locations$.subscribe(locations => {
      this.locations = locations;
      this.filtered = [];
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
    window.location.reload();
  }


  setLanguage(lang: 'ua' | 'en') {
    this.language = lang;
    // todo add localization logic
  }
}
