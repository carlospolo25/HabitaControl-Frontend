import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';

import { finalize } from 'rxjs';

import { API_CONFIG } from '../../../../core/config/api.config';

import {
  PersonResponse,
  PersonService,
} from '../../../../core/services/person/person-service';

import { FormPerfilPersonaComponent } from '../../form-perfil-persona/form-perfil-persona/form-perfil-persona';

@Component({
  selector: 'app-perfil-personas',
  standalone: true,
  imports: [
    CommonModule,
    FormPerfilPersonaComponent,
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

  constructor(
    private readonly personService: PersonService,
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

  abrirFormulario(): void {
    if (!this.perfil || this.isLoading) {
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

  obtenerFotoPerfil(): string | null {
    if (this.fotoNoDisponible) {
      return null;
    }

    const foto = this.perfil?.fotoUrl?.trim();

    if (!foto) {
      return null;
    }

    if (
      foto.startsWith('http://') ||
      foto.startsWith('https://') ||
      foto.startsWith('data:') ||
      foto.startsWith('blob:')
    ) {
      return foto;
    }

    const apiRoot = API_CONFIG.baseUrl.replace(
      /\/api\/?$/i,
      ''
    );

    const ruta = foto.startsWith('/')
      ? foto
      : `/${foto}`;

    return `${apiRoot}${ruta}`;
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