import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScannerQrVisitante } from '../scanner-qr-visitante/scanner-qr-visitante';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, switchMap } from 'rxjs';

import {
  RegistrarVisitanteRequest,
  VisitanteService,
} from '../../../../core/services/visitante/visitante';

@Component({
  selector: 'app-escanear-invitacion-visitante',
  standalone: true,
  imports: [CommonModule, FormsModule, ScannerQrVisitante],
  templateUrl: './escanear-invitacion-visitante.html',
  styleUrl: './escanear-invitacion-visitante.css',
})
export class EscanearInvitacionVisitante {
  @Output() cerrar = new EventEmitter<void>();

  token = '';

  visitante: RegistrarVisitanteRequest | null = null;

  isLoading = false;
  isRegistering = false;

  successMessage = '';
  errorMessage = '';
  mostrarScanner = false;

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

private limpiarMensajes(): void {
  this.errorMessage = '';
  this.successMessage = '';
}

private reiniciarFormulario(): void {
  this.token = '';
  this.limpiarVisitante();
  this.mostrarScanner = false;
  this.limpiarMensajes();
}

private limpiarVisitante(): void {
  this.visitante = null;
}

 validarInvitacion(): void {

    this.limpiarMensajes();
    this.visitante = null;

    const tokenLimpio = this.token.trim();

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

          if (!response.puedeIngresar || !response.visitante) {
            this.errorMessage = response.mensaje;
            return;
          }

          this.visitante = response.visitante;

          this.successMessage =
            response.mensaje || 'Invitación válida.';
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

    const tokenLimpio = this.token.trim();

    this.isRegistering = true;

    this.visitanteService
      .crearVisitante(this.visitante)
      .pipe(

        switchMap(() =>
          this.visitanteService.marcarInvitacionComoUsada(tokenLimpio)
        ),

        finalize(() => {
          this.isRegistering = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: () => {

          this.successMessage =
            'Ingreso registrado correctamente.';

          this.reiniciarFormulario();
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
    this.cerrar.emit();
  }
}