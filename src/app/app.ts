import {Component, OnInit, AfterViewInit, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MenuBarComponent} from './components/menu-bar/menu-bar.component';
import {LoginOverlay} from './components/login-overlay/login-overlay';
import {AuthService} from './core/services/security/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, MenuBarComponent, LoginOverlay
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit {
  protected readonly title = signal('Barrier-free-environment-web');
  showLogin: boolean = false;

  constructor(private authService: AuthService) {
  }

  ngOnInit() {
    this.authService.loginModal$.subscribe(show => this.showLogin = show);
  }

  ngAfterViewInit() {
    this.updateMenuBarHeight();

    // Оновлюємо при зміні розміру вікна
    window.addEventListener('resize', () => this.updateMenuBarHeight());
  }

  private updateMenuBarHeight() {
    const menuBar = document.querySelector('app-menu-bar');
    if (menuBar) {
      const menuBarHeight = menuBar.clientHeight; // 🔥 Отримуємо реальну висоту
      console.log('Menu bar height:', menuBarHeight); // Для дебагу

      document.documentElement.style.setProperty(
        '--menu-bar-height',
        `${menuBarHeight}px`
      );
    }
  }
}
