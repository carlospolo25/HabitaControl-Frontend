import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { finalize } from 'rxjs';

import {
  AuthPersona,
  LoginPersonaRequest,
} from '../../../core/services/authPersona/auth-persona';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  email = '';
  password = '';

  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private readonly authPersona: AuthPersona,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  forgotPassword(): void {
    this.router.navigate(['/solicitar-recuperacion']);
  }

  login(): void {

    if (this.loading) {
      return;
    }

    this.errorMessage = '';

    const request: LoginPersonaRequest = {
      email: this.email.trim(),
      password: this.password
    };

    if (!request.email || !request.password.trim()) {
      this.errorMessage =
        'Ingrese su correo electrónico y contraseña.';
      return;
    }

    this.loading = true;

    this.authPersona
      .loginPersona(request)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {

          this.authPersona.guardarTokensPersona(response);

          this.router.navigate(['/dashboard-persona']);
        },

        error: ({ error }) => {

          this.errorMessage =
            error?.message ??
            'No fue posible iniciar sesión. Inténtelo nuevamente.';
        }
      });
  }
}