import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { finalize } from 'rxjs';

import {
  RecuperacionContrasenaService,
  ValidarRecuperacionContrasenaResponse,
} from '../../../core/services/recuperacion-contrasena/recuperacion-contrasena.service.ts';

@Component({
  selector: 'app-restablecer-contrasena',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
  ],
  templateUrl: './restablecer-contrasena.html',
  styleUrl: './restablecer-contrasena.css',
})
export class RestablecerContrasena implements OnInit {

  token = '';

  nuevaContrasena = '';
  confirmarContrasena = '';

  mostrarNuevaContrasena = false;
  mostrarConfirmarContrasena = false;

  isValidating = true;
  isSubmitting = false;

  tokenValido = false;
  tokenExpirado = false;
  tokenUsado = false;
  tokenCancelado = false;

  hasErrors = false;
  errorMessage = '';

  successMessage = '';

  informacionToken:
    | ValidarRecuperacionContrasenaResponse
    | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly recuperacionService: RecuperacionContrasenaService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.obtenerToken();
  }

  private obtenerToken(): void {
    this.token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

    if (!this.token) {
      this.isValidating = false;
      this.tokenValido = false;
      this.hasErrors = true;
      this.errorMessage =
        'El enlace de recuperación no contiene un token válido.';
      return;
    }

    this.validarToken();
  }

  validarToken(): void {
    this.limpiarMensajes();

    this.isValidating = true;
    this.tokenValido = false;
    this.tokenExpirado = false;
    this.tokenUsado = false;
    this.tokenCancelado = false;

    this.recuperacionService
      .validarToken(this.token)
      .pipe(
        finalize(() => {
          this.isValidating = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: response => {
          this.informacionToken = response;

          this.tokenValido = response.valido;

          if (!response.valido) {
            this.procesarEstadoToken(response);
          }
        },
        error: error => {
          this.tokenValido = false;
          this.hasErrors = true;

          this.errorMessage =
            error?.error?.message ??
            error?.error?.mensaje ??
            'No fue posible validar el enlace de recuperación.';
        },
      });
  }

  tieneLongitudMinima(): boolean {
    return this.nuevaContrasena.length >= 8;
  }

  tieneMayuscula(): boolean {
    return /[A-Z]/.test(this.nuevaContrasena);
  }

  tieneMinuscula(): boolean {
    return /[a-z]/.test(this.nuevaContrasena);
  }

  tieneNumero(): boolean {
    return /\d/.test(this.nuevaContrasena);
  }

  tieneCaracterEspecial(): boolean {
    return /[^A-Za-z0-9]/.test(this.nuevaContrasena);
  }

  restablecer(): void {
    this.limpiarMensajes();

    if (!this.tokenValido) {
      this.hasErrors = true;
      this.errorMessage =
        'El enlace de recuperación no es válido.';
      return;
    }

    if (!this.nuevaContrasena.trim()) {
      this.hasErrors = true;
      this.errorMessage =
        'Debes ingresar una nueva contraseña.';
      return;
    }

    if (!this.cumpleReglasContrasena(this.nuevaContrasena)) {
      this.hasErrors = true;
      this.errorMessage =
        'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.';
      return;
    }

    if (!this.confirmarContrasena) {
      this.hasErrors = true;
      this.errorMessage =
        'Debes confirmar la nueva contraseña.';
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.hasErrors = true;
      this.errorMessage =
        'Las contraseñas no coinciden.';
      return;
    }

    this.isSubmitting = true;

    this.recuperacionService
      .restablecer({
        token: this.token,
        nuevaContrasena: this.nuevaContrasena,
        confirmarContrasena: this.confirmarContrasena,
      })
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: response => {
          this.tokenValido = false;

          this.nuevaContrasena = '';
          this.confirmarContrasena = '';

          this.successMessage =
            response.mensaje ??
            'La contraseña fue restablecida correctamente.';
        },
        error: error => {
          this.hasErrors = true;

          this.errorMessage =
            error?.error?.message ??
            error?.error?.mensaje ??
            'No fue posible restablecer la contraseña.';
        },
      });
  }

  private procesarEstadoToken(
    response: ValidarRecuperacionContrasenaResponse,
  ): void {
    const mensaje = response.mensaje?.toLowerCase() ?? '';

    this.tokenExpirado = mensaje.includes('expir');
    this.tokenUsado = mensaje.includes('utiliz') || mensaje.includes('usado');
    this.tokenCancelado = mensaje.includes('cancel');

    this.hasErrors = true;
    this.errorMessage =
      response.mensaje ??
      'El enlace de recuperación no es válido.';
  }

  cumpleReglasContrasena(contrasena: string): boolean {
    const tieneLongitud = contrasena.length >= 8;
    const tieneMayuscula = /[A-Z]/.test(contrasena);
    const tieneMinuscula = /[a-z]/.test(contrasena);
    const tieneNumero = /\d/.test(contrasena);
    const tieneEspecial = /[^A-Za-z0-9]/.test(contrasena);

    return (
      tieneLongitud &&
      tieneMayuscula &&
      tieneMinuscula &&
      tieneNumero &&
      tieneEspecial
    );
  }

  contrasenasCoinciden(): boolean {
    return (
      this.confirmarContrasena.length > 0 &&
      this.nuevaContrasena === this.confirmarContrasena
    );
  }

  alternarNuevaContrasena(): void {
    this.mostrarNuevaContrasena = !this.mostrarNuevaContrasena;
  }

  alternarConfirmarContrasena(): void {
    this.mostrarConfirmarContrasena =
      !this.mostrarConfirmarContrasena;
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }

  limpiarMensajes(): void {
    this.hasErrors = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}