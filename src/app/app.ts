import {Component, OnInit, signal} from '@angular/core';
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
export class App implements OnInit{
  protected readonly title = signal('Barrier-free-environment-web');
  showLogin: boolean = false;

  constructor(private authService: AuthService) {
  }

  ngOnInit() {
    this.authService.loginModal$.subscribe(show => this.showLogin = show);
  }
}
