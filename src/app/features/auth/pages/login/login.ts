import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AuthService } from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  rememberMe = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  login(): void {
    if (this.isLoading) return;

    this.errorMessage = '';

    const email = this.email.trim().toLowerCase();
    const password = this.password;

    if (!email || !password) {
      this.errorMessage = 'Ingresa tu correo y contraseña.';
      return;
    }

    this.isLoading = true;

    this.authService.login({ email, password })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/dashboard');
        },
        error: (error) => {
          this.errorMessage = this.getLoginErrorMessage(error);
          this.cdr.detectChanges();
        },
      });
  }

  clearError(): void {
    this.errorMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegister(): void {
    this.router.navigateByUrl('/register');
  }

  forgotPassword(): void {
    this.router.navigate(['/solicitar-recuperacion']);
  }

private getLoginErrorMessage(error: any): string {
  if (error.status === 0) {
    return 'No hay conexión con el servidor.';
  }

  const backendMessage =
    error?.error?.message ??
    error?.error?.mensaje ??
    error?.error?.title;

  if (
    typeof backendMessage === 'string' &&
    backendMessage.trim()
  ) {
    return backendMessage;
  }

  if (error.status === 401) {
    return 'Correo o contraseña incorrectos.';
  }

  if (error.status === 403) {
    return 'No tienes permisos para iniciar sesión.';
  }

  if (error.status === 500) {
    return 'Ocurrió un error interno al iniciar sesión.';
  }

  return 'No pudimos iniciar sesión. Intenta nuevamente.';
}
}