import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';

import { ScannerQrVisitante } from '../scanner-qr-visitante/scanner-qr-visitante';

import {
  RegistrarVisitanteRequest,
  VisitanteService,
} from '../../../../core/services/visitante/visitante';

@Component({
  selector: 'app-escanear-invitacion-visitante',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScannerQrVisitante,
  ],
  templateUrl: './escanear-invitacion-visitante.html',
  styleUrl: './escanear-invitacion-visitante.css',
})
export class EscanearInvitacionVisitante {
  @Output() cerrar = new EventEmitter<void>();

  token = '';

  visitante: RegistrarVisitanteRequest | null = null;

  foto: File | null = null;
  fotoPreview: string | null = null;

  isLoading = false;
  isRegistering = false;

  successMessage = '';
  errorMessage = '';

  mostrarScanner = false;

  private readonly maxFotoBytes =
    5 * 1024 * 1024;

  private readonly tiposFotoPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  constructor(
    private readonly visitanteService: VisitanteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get estaProcesando(): boolean {
    return this.isLoading || this.isRegistering;
  }

  abrirScanner(): void {
    this.limpiarMensajes();
    this.mostrarScanner = true;
  }

  cerrarScanner(): void {
    this.mostrarScanner = false;
  }

  onTokenDetectado(token: string): void {
    this.token = token.trim();
    this.mostrarScanner = false;

    this.validarInvitacion();
  }

  onFotoSeleccionada(event: Event): void {
    this.errorMessage = '';

    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.[0];

    if (!archivo) {
      this.limpiarFoto();
      return;
    }

    if (
      !this.tiposFotoPermitidos.includes(
        archivo.type
      )
    ) {
      this.errorMessage =
        'Solo se permiten imágenes JPG, JPEG, PNG o WEBP.';

      input.value = '';
      this.limpiarFoto();
      return;
    }

    if (archivo.size > this.maxFotoBytes) {
      this.errorMessage =
        'La imagen no puede superar los 5 MB.';

      input.value = '';
      this.limpiarFoto();
      return;
    }

    this.foto = archivo;

    const reader = new FileReader();

    reader.onload = () => {
      this.fotoPreview =
        reader.result as string;

      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.errorMessage =
        'No fue posible cargar la vista previa de la imagen.';

      this.limpiarFoto();

      this.cdr.detectChanges();
    };

    reader.readAsDataURL(archivo);
  }

  eliminarFoto(): void {
    this.limpiarFoto();
  }

  validarInvitacion(): void {
    this.limpiarMensajes();
    this.limpiarVisitante();
    this.limpiarFoto();

    const tokenLimpio =
      this.token.trim();

    if (!tokenLimpio) {
      this.errorMessage =
        'Debes ingresar o escanear el token de la invitación.';
      return;
    }

    this.isLoading = true;

    this.visitanteService
      .validarInvitacion(tokenLimpio)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (
            !response.puedeIngresar ||
            !response.visitante
          ) {
            this.errorMessage =
              response.mensaje;

            return;
          }

          this.visitante =
            response.visitante;

          this.successMessage =
            response.mensaje ||
            'Invitación válida.';
        },

        error: (err: HttpErrorResponse) => {
          this.errorMessage =
            err.error?.mensaje ||
            err.error ||
            'No se pudo validar la invitación.';
        },
      });
  }

  registrarIngreso(): void {
    if (!this.visitante) {
      this.errorMessage =
        'Primero debes validar una invitación.';
      return;
    }

    this.limpiarMensajes();

    const tokenLimpio =
      this.token.trim();

    if (!tokenLimpio) {
      this.errorMessage =
        'No fue posible identificar la invitación.';
      return;
    }

    const request: RegistrarVisitanteRequest = {
      ...this.visitante,
      foto: this.foto,
    };

    this.isRegistering = true;

    this.visitanteService
      .crearVisitante(request)
      .pipe(
        switchMap(() =>
          this.visitanteService
            .marcarInvitacionComoUsada(
              tokenLimpio
            )
        ),

        finalize(() => {
          this.isRegistering = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.reiniciarFormulario();

          this.successMessage =
            'Ingreso registrado correctamente.';
        },

        error: (err: HttpErrorResponse) => {
          this.errorMessage =
            err.error?.mensaje ||
            err.error ||
            'No se pudo registrar el ingreso del visitante.';
        },
      });
  }

  cerrarFormulario(): void {
    if (this.estaProcesando) {
      return;
    }

    this.cerrar.emit();
  }

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private reiniciarFormulario(): void {
    this.token = '';
    this.limpiarVisitante();
    this.limpiarFoto();
    this.mostrarScanner = false;
  }

  private limpiarVisitante(): void {
    this.visitante = null;
  }

  private limpiarFoto(): void {
    this.foto = null;
    this.fotoPreview = null;
  }
}