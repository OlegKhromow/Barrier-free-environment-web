import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/security/auth.service';
import { UserDTO } from '../../core/dtos/user-dto';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-list-page.component.html',
  styleUrls: ['./user-list-page.component.css']
})
export class UserListPageComponent implements OnInit {
  users: UserDTO[] = [];
  showModal = false;
  createForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadUsers();

    this.createForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['USER', Validators.required]
    });
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (data) => (this.users = data),
      error: (err) => window.alert(err.error || 'Не вдалося отримати користувачів')
    });
  }

  openUser(username: string): void {
    this.router.navigate(['/users', username]);
  }

  openCreateModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.createForm.reset({ role: 'USER' });
  }

  createUser(): void {
    if (this.createForm.invalid) return;

    const newUser = this.createForm.value;

    this.authService.registerUser(newUser).subscribe({
      next: (message) => {
        alert(message);  // тепер точно "Registration was successfull"
        this.closeModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error(err);

        // Беремо текст помилки від сервера
        const msg = typeof err.error === 'string' ? err.error : 'Не вдалося створити користувача';
        alert(msg);
      }
    });
  }


}
