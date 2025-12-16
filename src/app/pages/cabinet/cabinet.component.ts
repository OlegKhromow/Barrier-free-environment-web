import {Component, inject, OnInit} from '@angular/core';
import {AuthService} from '../../core/services/security/auth.service';
import {CabinetSideMenu} from '../../components/cabinet-side-menu/cabinet-side-menu';
import {RouterOutlet} from '@angular/router';


@Component({
  selector: 'app-cabinet',
  imports: [CabinetSideMenu, RouterOutlet],
  templateUrl: './cabinet.html',
  styleUrl: './cabinet.css'
})
export class Cabinet implements OnInit {
  private authService = inject(AuthService);

  user: any = null;
  isAdmin = false;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.authService.getByUsername().subscribe({
      next: (data) => {
        this.user = data;

        this.authService.getAuthoritiesByUsername().subscribe({
          next: (roles) => (this.isAdmin = roles.includes('ADMIN'))
        });
      },
      error: (err) => {
        console.error('Помилка при завантаженні користувача', err);
        this.error = 'Не вдалося отримати дані користувача';
        this.loading = false;
      }
    });
  }

}
