import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ConfirmarPasswordPersonaRequest,
  PersonService,
} from '../../../core/services/person/person-service';

@Component({
  selector: 'app-eliminar-cuenta-persona',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './eliminar-cuenta-persona.html',
  styleUrl: './eliminar-cuenta-persona.css',
})
export class EliminarCuentaPersona {

  @Output() cerrar =
    new EventEmitter<void>();

  password = '';

  mostrarPassword = false;

  passwordConfirmada = false;

  isConfirmingPassword = false;

  isDeleting = false;

  errorMessage = '';

  successMessage = '';

  constructor(
    private readonly personService: PersonService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  alternarPassword(): void {
    this.mostrarPassword =
      !this.mostrarPassword;
  }

  cerrarFormulario(): void {
    if (
      this.isConfirmingPassword ||
      this.isDeleting
    ) {
      return;
    }

    this.limpiarFormulario();

    this.cerrar.emit();
  }

  confirmarPassword(): void {
    if (
      this.isConfirmingPassword ||
      this.isDeleting
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.passwordConfirmada = false;

    const password = this.password;

    if (
      !password ||
      !password.trim()
    ) {
      this.errorMessage =
        'Debes ingresar tu contraseña para continuar.';

      return;
    }

    const request: ConfirmarPasswordPersonaRequest = {
      password,
    };

    this.isConfirmingPassword = true;

    this.personService
      .confirmarPassword(request)
      .pipe(
        finalize(() => {
          this.isConfirmingPassword = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.passwordConfirmada = true;

          this.errorMessage = '';

          this.successMessage =
            response.message ||
            'Contraseña confirmada correctamente.';

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Error confirmando la contraseña de la persona:',
            error
          );

          this.passwordConfirmada = false;

          this.successMessage = '';

          this.errorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible confirmar la contraseña.'
            );
        },
      });
  }

  eliminarCuenta(): void {
    if (
      this.isDeleting ||
      this.isConfirmingPassword
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.passwordConfirmada) {
      this.errorMessage =
        'Primero debes confirmar tu contraseña.';

      return;
    }

    this.isDeleting = true;

    this.personService
      .eliminarMiCuenta()
      .pipe(
        finalize(() => {
          this.isDeleting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.limpiarSesion();
          this.limpiarFormulario();

          this.router.navigate([
            '/login-persona',
          ]);
        },

        error: (error) => {
          console.error(
            'Error eliminando la cuenta de la persona:',
            error
          );

          this.errorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible eliminar la cuenta.'
            );
        },
      });
  }

  onPasswordChange(): void {
    if (this.passwordConfirmada) {
      this.passwordConfirmada = false;
      this.successMessage = '';
    }

    this.errorMessage = '';
  }

  private limpiarFormulario(): void {
    this.password = '';

    this.mostrarPassword = false;

    this.passwordConfirmada = false;

    this.errorMessage = '';

    this.successMessage = '';
  }

  private limpiarSesion(): void {
    localStorage.removeItem(
      'personaAccessToken'
    );

    localStorage.removeItem(
      'personaRefreshToken'
    );

    sessionStorage.removeItem(
      'personaAccessToken'
    );

    sessionStorage.removeItem(
      'personaRefreshToken'
    );
  }

  private obtenerMensajeError(
    error: any,
    mensajePredeterminado: string
  ): string {

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

    const validationErrors =
      error?.error?.errors;

    if (
      validationErrors &&
      typeof validationErrors === 'object'
    ) {
      const firstValidationError =
        Object.values(validationErrors)
          .flat()
          .find(
            (message) =>
              typeof message === 'string' &&
              message.trim().length > 0
          );

      if (
        typeof firstValidationError === 'string'
      ) {
        return firstValidationError;
      }
    }

    switch (error?.status) {

      case 0:
        return 'No fue posible conectarse con el servidor.';

      case 400:
        return 'La solicitud no es válida.';

      case 401:
        return 'La contraseña ingresada no es correcta.';

      case 403:
        return 'No tienes permisos para realizar esta operación.';

      case 404:
        return 'No se encontró la cuenta asociada.';

      case 409:
        return 'La cuenta ya fue eliminada permanentemente.';

      case 500:
        return 'Ocurrió un error interno al procesar la solicitud.';

      default:
        return mensajePredeterminado;
    }
  }
}