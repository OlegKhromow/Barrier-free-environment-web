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
export class MenuBarComponent implements OnInit{
  router = inject(Router);
  isOpen = false;
  isLogin = false;

  authService: AuthService = inject(AuthService)

  ngOnInit() {
    this.authService.isLoggedIn$.subscribe(value => this.isLogin = value);
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  openLogin(){
    this.authService.openLoginModal();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
