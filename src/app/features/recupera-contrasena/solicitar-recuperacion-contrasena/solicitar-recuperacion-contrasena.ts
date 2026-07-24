import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  RecuperacionContrasenaResponse,
  RecuperacionContrasenaService,
  SolicitarRecuperacionContrasenaRequest,
} from '../../../core/services/recuperacion-contrasena/recuperacion-contrasena.service.ts'

@Component({
  selector: 'app-solicitar-recuperacion-contrasena',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './solicitar-recuperacion-contrasena.html',
  styleUrl: './solicitar-recuperacion-contrasena.css',
})
export class SolicitarRecuperacionContrasena {
  email = '';

  isSubmitting = false;

  hasErrors = false;
  errorMessage = '';

  successMessage = '';

  constructor(
    private readonly recuperacionService: RecuperacionContrasenaService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  solicitar(): void {
    this.limpiarMensajes();

    if (!this.email.trim()) {
      this.hasErrors = true;
      this.errorMessage = 'Ingresa tu correo electrónico.';
      return;
    }

    this.isSubmitting = true;

    const request: SolicitarRecuperacionContrasenaRequest = {
      email: this.email.trim(),
    };

    this.recuperacionService
      .solicitar(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: RecuperacionContrasenaResponse) => {
          this.successMessage = response.mensaje;
        },

        error: (error) => {
          this.hasErrors = true;

          this.errorMessage =
            error?.error?.message ??
            error?.error?.mensaje ??
            'No fue posible procesar la solicitud. Inténtalo nuevamente.';
        },
      });
  }

  private limpiarMensajes(): void {
    this.hasErrors = false;
    this.errorMessage = '';
    this.successMessage = '';
  }
}