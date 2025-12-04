import { Component } from '@angular/core';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../core/services/security/auth.service';

@Component({
  selector: 'app-login-overlay',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './login-overlay.html',
  styleUrl: './login-overlay.css'
})
export class LoginOverlay {

  form;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.form = this.fb.group({
      username: [''],
      password: ['']
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const { username, password } = this.form.value;
      this.auth.login(username!, password!).subscribe({
        next: () => {
          this.auth.closeLoginModal();
          window.location.reload();
        },
        error: (err) => {
          console.log(err);
          alert('Login failed ');
        },
      });
    }
  }

  close(event: MouseEvent | null){
    if (event?.target === event?.currentTarget)
      this.auth.closeLoginModal();
  }

  forgotPassword() {

  }

  openRegister() {
    this.auth.closeLoginModal();
    this.auth.openRegisterModal();
  }
}
