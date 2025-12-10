import {Component, OnInit, AfterViewInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {MenuBarComponent} from './components/menu-bar/menu-bar.component';
import {LoginOverlay} from './components/login-overlay/login-overlay';
import {AuthService} from './core/services/security/auth.service';
import {RegisterOverlay} from './components/register-overlay/register-overlay';
import {AlertService} from './core/services/alert.service';
import {AlertModalComponent} from './components/alert-modal/alert-modal.component';
import {AsyncPipe} from '@angular/common';
import {AccessibilityToolbarComponent} from './components/accessibility-toolbar/accessibility-toolbar.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, MenuBarComponent, LoginOverlay, RegisterOverlay, AlertModalComponent, AsyncPipe, AccessibilityToolbarComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, AfterViewInit {
  showLogin: boolean = false;
  showRegister: boolean = false;

  constructor(private authService: AuthService, public alert: AlertService) {
  }

  ngOnInit() {
    this.authService.loginModal$.subscribe(show => this.showLogin = show);
    this.authService.registerModal$.subscribe(show => this.showRegister = show);
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
      // console.log('Menu bar height:', menuBarHeight); // Для дебагу

      document.documentElement.style.setProperty(
        '--menu-bar-height',
        `${menuBarHeight}px`
      );
    }
  }
}
