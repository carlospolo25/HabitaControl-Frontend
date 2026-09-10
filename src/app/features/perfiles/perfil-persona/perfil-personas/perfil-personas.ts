import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';

import { finalize } from 'rxjs';
import { Router } from '@angular/router';

import {
  PersonResponse,
  PersonService,
} from '../../../../core/services/person/person-service';

import { FormPerfilPersonaComponent } from '../../form-perfil-persona/form-perfil-persona/form-perfil-persona';
import { EliminarCuentaPersona } from '../../../persona/eliminar-cuenta-persona/eliminar-cuenta-persona';

@Component({
  selector: 'app-perfil-personas',
  standalone: true,
  imports: [
    CommonModule,
    FormPerfilPersonaComponent,
    EliminarCuentaPersona
  ],
  templateUrl: './perfil-personas.html',
  styleUrl: './perfil-personas.css',
})
export class PerfilPersonasComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  perfil: PersonResponse | null = null;

  isLoading = false;
  hasError = false;
  errorMessage = '';

  mostrarFormulario = false;
  fotoNoDisponible = false;
  mostrarEliminarCuenta = false;

  constructor(
    private readonly personService: PersonService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.fotoNoDisponible = false;

    this.personService
      .obtenerMiPerfil()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (perfil) => {
          this.perfil = perfil;
          this.hasError = false;
          this.errorMessage = '';
          this.fotoNoDisponible = false;
        },
        error: (error) => {
          console.error(
            'Error consultando el perfil de la persona:',
            error
          );

          this.perfil = null;
          this.hasError = true;
          this.errorMessage = this.obtenerMensajeError(
            error,
            'No fue posible cargar la información del perfil.'
          );
        },
      });
  }

  abrirEliminarCuenta(): void {
    if (
      this.isLoading ||
      !this.perfil ||
      this.mostrarFormulario
    ) {
      return;
    }

    this.mostrarEliminarCuenta = true;
  }

  cerrarEliminarCuenta(): void {
    this.mostrarEliminarCuenta = false;
  }

  abrirFormulario(): void {
    if (
      !this.perfil ||
      this.isLoading ||
      this.mostrarEliminarCuenta
    ) {
      return;
    }

    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  recibirPerfilActualizado(
    perfilActualizado: PersonResponse
  ): void {
    this.perfil = perfilActualizado;
    this.mostrarFormulario = false;
    this.hasError = false;
    this.errorMessage = '';
    this.fotoNoDisponible = false;

    this.cdr.detectChanges();
  }

  cerrarVista(): void {
    this.cerrar.emit();
  }

  irACambiarContrasena(): void {
    this.router.navigate([
      '/solicitar-recuperacion',
    ]);
  }

  obtenerFotoPerfil(): string | null {
    if (
      this.fotoNoDisponible ||
      !this.perfil?.fotoUrl
    ) {
      return null;
    }

    return this.personService.obtenerFotoUrl(
      this.perfil.id
    );
  }

  obtenerIniciales(): string {
    const nombre = this.perfil?.name?.trim();

    if (!nombre) {
      return 'US';
    }

    const partes = nombre
      .split(/\s+/)
      .filter((x) => x.length > 0);

    if (partes.length === 1) {
      return partes[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
  }

  manejarErrorFoto(): void {
    this.fotoNoDisponible = true;
  }

  formatearFecha(
    fecha: string | null | undefined
  ): string {
    if (!fecha) {
      return 'Sin registro';
    }

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return 'Sin registro';
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(valor);
  }

  cerrarError(): void {
    this.hasError = false;
    this.errorMessage = '';
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
        return 'Tu sesión ha expirado.';

      case 403:
        return 'No tienes permisos para consultar este perfil.';

      case 404:
        return 'No se encontró la información del perfil.';

      case 500:
        return 'Ocurrió un error interno al consultar el perfil.';

      default:
        return mensajePredeterminado;
    }
  }
}