import { Component } from '@angular/core';
import { AuthService } from '../../core/services/security/auth.service';
import { inject } from '@angular/core';
import { CabinetSideMenu } from '../../components/cabinet-side-menu/cabinet-side-menu';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-cabinet-v2',
  imports: [CabinetSideMenu, RouterOutlet],
  templateUrl: './cabinet-v2.html',
  styleUrl: './cabinet-v2.css'
})
export class CabinetV2 {
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
