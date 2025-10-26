import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/security/auth.service';
import { UserDTO } from '../../core/dtos/user-dto';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list-page.component.html',
  styleUrls: ['./user-list-page.component.css']
})
export class UserListPageComponent implements OnInit {
  users: UserDTO[] = [];
  error: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.getAllUsers().subscribe({
      next: (data) => (this.users = data),
      error: (err) => (this.error = err.error || 'Не вдалося отримати користувачів')
    });
  }

  openUser(username: string): void {
    this.router.navigate(['/users', username]);
  }
}
