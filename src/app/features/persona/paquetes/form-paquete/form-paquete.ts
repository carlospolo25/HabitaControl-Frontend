import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  RegistrarPaqueteRequest,
  PaqueteService,
} from '../../../../core/services/paquete/paquete';

@Component({
  selector: 'app-form-paquete',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-paquete.html',
  styleUrl: './form-paquete.css',
})
export class FormPaqueteComponent {
  @Output() cerrar = new EventEmitter<void>();
  @Output() paqueteRegistrado = new EventEmitter<void>();

  nombreDestinatario = '';
  apartamento = '';
  torre = '';
  descripcion = '';

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly paqueteService: PaqueteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  guardar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';

    const nombreDestinatario =
      this.nombreDestinatario.trim();

    const apartamento =
      this.apartamento.trim();

    const torre =
      this.torre.trim();

    const descripcion =
      this.descripcion.trim();

    if (!nombreDestinatario) {
      this.errorMessage =
        'Ingresa el nombre del destinatario.';
      return;
    }

    if (nombreDestinatario.length > 150) {
      this.errorMessage =
        'El nombre del destinatario no puede superar los 150 caracteres.';
      return;
    }

    if (torre.length > 20) {
      this.errorMessage =
        'La torre no puede superar los 20 caracteres.';
      return;
    }

    if (apartamento.length > 20) {
      this.errorMessage =
        'El apartamento no puede superar los 20 caracteres.';
      return;
    }

    if (descripcion.length > 300) {
      this.errorMessage =
        'La descripción no puede superar los 300 caracteres.';
      return;
    }

    const request: RegistrarPaqueteRequest = {
      nombreDestinatario,
      torre,
      apartamento,
      descripcion,
    };
    
    this.isSubmitting = true;

    this.paqueteService
      .registrar(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.paqueteRegistrado.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.obtenerMensajeError(
            error,
            'No fue posible registrar el paquete.'
          );
        },
      });
  }

  cerrarFormulario(): void {
    if (this.isSubmitting) {
      return;
    }

    this.cerrar.emit();
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.cerrarFormulario();
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    if (error.status === 0) {
      return 'No fue posible conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    }

    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (
      typeof error.error?.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message;
    }

    if (
      typeof error.error?.mensaje === 'string' &&
      error.error.mensaje.trim()
    ) {
      return error.error.mensaje;
    }

    if (
      typeof error.error?.detail === 'string' &&
      error.error.detail.trim()
    ) {
      return error.error.detail;
    }

    if (error.error?.errors) {
      const mensajes = Object.values(error.error.errors)
        .flat()
        .filter(
          (mensaje): mensaje is string =>
            typeof mensaje === 'string'
        );

      if (mensajes.length > 0) {
        return mensajes.join(' ');
      }
    }

    switch (error.status) {
      case 400:
        return 'La información ingresada no es válida. Revisa los campos del formulario.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para registrar paquetes.';

      case 404:
        return 'No se encontró el residente o apartamento indicado.';

      case 409:
        return 'No fue posible registrar el paquete debido a un conflicto con la información ingresada.';

      default:
        return mensajePredeterminado;
    }
  }
}