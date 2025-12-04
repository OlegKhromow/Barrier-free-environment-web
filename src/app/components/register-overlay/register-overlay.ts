import {Component} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {AuthService} from '../../core/services/security/auth.service';
import {catchError, map, of} from 'rxjs';
import {AlertService} from '../../core/services/alert.service';

@Component({
  selector: 'app-register-overlay',
  imports: [
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './register-overlay.html',
  styleUrl: './register-overlay.css'
})
export class RegisterOverlay {
  form = new FormGroup({
    username: new FormControl('', {
      validators: [Validators.required],
      asyncValidators: [this.uniqueUsernameValidator()],
      updateOn: 'blur'
    }),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', Validators.required),
    verificationCode: new FormControl(''),
    showPassword: new FormControl(false)
  });

  emailSent = false;
  isLoading = false;

  constructor(private auth: AuthService, private alert: AlertService) {
  }

  get passwordMismatch() {
    return this.form.value.password !== this.form.value.confirmPassword;
  }

  get showPassword() {
    return this.form.get('showPassword')?.value;
  }

  uniqueUsernameValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      return this.auth.checkUsername(control.value).pipe(
        map(() => {
          // result не null -> користувач знайдений
          return {taken: true};
        }),
        catchError(err => {
          if (err.status === 404) {
            return of(null); // VALID → username вільний
          }
          // інші помилки → invalid
          return of({serverError: true});
        })
      );
    };
  }

  sendVerificationEmail() {
    this.form.markAllAsTouched();

    const requiredControls = ['username', 'email', 'password', 'confirmPassword'];

    const isInvalid = requiredControls.some(
      ctrl => this.form.get(ctrl)!.invalid
    );
    if (isInvalid || this.passwordMismatch) return;

    this.setLoadingState(true);

    // Відправлення email
    this.auth.sendVerificationEmail(this.form.value.email!)
      .subscribe({
        next: () => {
          this.emailSent = true;
          this.setLoadingState(false);
        },
        error: () => {
          this.setLoadingState(false);
          this.cancel();
          this.alert.open("Не вдалося відправити код. Спробуйте пізніше");
        }
      });

  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.auth.verifyEmailCode(this.form.value.email!, this.form.value.verificationCode!)
      .subscribe({
        next: () => {
          this.alert.open("Email підтверджено!");
          const user = {
            username: this.form.value.username,
            password: this.form.value.password,
            email: this.form.value.email,
            role: 'USER'
          }
          this.auth.registerUser(user).subscribe({
            next: () => {
              this.cancel();
              this.alert.open('Реєстрація пройшла успішно.\nТепер ви можете авторизувати за вашим логіном та паролем');  // тепер точно "Registration was successfull"
            },
            error: (err) => {
              const msg = typeof err.error === 'string' ? err.error : 'Не вдалося створити користувача';
              this.cancel();
              this.alert.open(msg);
            }
          })
        },
        error: () => {
          this.form.get('verificationCode')?.setErrors({ invalid: true });
        }
      });
  }

  cancel() {
    this.auth.closeRegisterModal();
  }

  cancelVerification() {
    this.emailSent = false;
    this.form.patchValue({verificationCode: ''});
  }

  close(event: MouseEvent | null) {
    if (event?.target === event?.currentTarget) {
      this.cancel();
    }
  }

  private setLoadingState(loading: boolean) {
    this.isLoading = loading;
    if (loading) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }
}
