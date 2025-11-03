import { Component,inject, OnInit } from '@angular/core';
import{ AuthService } from '../../core/services/security/auth.service';

@Component({
  selector: 'app-profile-component',
  imports: [],
  templateUrl: './profile-component.html',
  styleUrl: './profile-component.css'
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);

  isAdmin = false;
  user: any = null;

  ngOnInit() {
this.authService.getByUsername().subscribe({
      next: (data) => {
        this.user = data;

        this.authService.getAuthoritiesByUsername().subscribe({
          next: (roles) => (this.isAdmin = roles.includes('ADMIN'))
        });
  }
    });
  }

}
