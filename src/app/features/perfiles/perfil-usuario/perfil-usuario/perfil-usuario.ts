import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';

import { finalize } from 'rxjs';

import {
  AuthService,
  PerfilUsuarioResponse,
} from '../../../../core/services/auth/auth';

import { EliminarCuentaAdmin } from '../../../persona/eliminar-cuenta-admin/eliminar-cuenta-admin';

import {
  FormPerfilUsuarioComponent,
} from '../../form-perfil-usuario/form-perfil-usuario/form-perfil-usuario';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormPerfilUsuarioComponent,
    EliminarCuentaAdmin,
  ],
  templateUrl: './perfil-usuario.html',
  styleUrl: './perfil-usuario.css',
})
export class PerfilUsuarioComponent implements OnInit {
  @Output()
  cerrar = new EventEmitter<void>();

  private readonly apiBaseUrl =
    'https://localhost:7232';

  perfil: PerfilUsuarioResponse | null = null;

  isLoading = false;
  hasError = false;

  errorMessage = '';

  mostrarFormulario = false;
  fotoNoDisponible = false;

  mostrarEliminarCuenta = false;



  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  /* =========================================================
     CARGA DEL PERFIL
     ========================================================= */

  cargarPerfil(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.fotoNoDisponible = false;

    this.authService
      .obtenerPerfil()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: perfil => {
          this.perfil = perfil;

          this.hasError = false;
          this.errorMessage = '';
          this.fotoNoDisponible = false;
        },
        error: error => {
          console.error(
            'Error consultando el perfil del administrador:',
            error
          );

          this.perfil = null;
          this.hasError = true;

          this.errorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar la información del perfil.'
            );
        },
      });
  }

  /* =========================================================
     FORMULARIO
     ========================================================= */

  abrirFormulario(): void {
    if (
      !this.perfil ||
      this.isLoading ||
      this.mostrarEliminarCuenta
    ) {
      return;
    }

    this.mostrarFormulario = true;
    this.errorMessage = '';
    this.hasError = false;
  }

  /* =========================================================
    ELIMINACIÓN DE CUENTA
    ========================================================= */

  abrirEliminarCuenta(): void {
    if (
      !this.perfil ||
      this.isLoading ||
      this.mostrarFormulario
    ) {
      return;
    }

    this.mostrarEliminarCuenta = true;
  }

  cerrarEliminarCuenta(): void {
    this.mostrarEliminarCuenta = false;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  recibirPerfilActualizado(
    perfilActualizado: PerfilUsuarioResponse
  ): void {
    this.perfil = perfilActualizado;

    this.mostrarFormulario = false;
    this.hasError = false;
    this.errorMessage = '';
    this.fotoNoDisponible = false;

    this.cdr.detectChanges();
  }

  /* =========================================================
     CIERRE DEL COMPONENTE
     ========================================================= */

  cerrarVista(): void {
    if (this.mostrarEliminarCuenta) {
      this.cerrarEliminarCuenta();
      return;
    }

    if (this.mostrarFormulario) {
      this.cerrarFormulario();
      return;
    }

    this.cerrar.emit();
  }

  irACambiarContrasena(): void {
    this.router.navigate(['/solicitar-recuperacion',
    ]);
  }

  /* =========================================================
     FOTOGRAFÍA
     ========================================================= */

  obtenerFotoPerfil(): string | null {
    if (this.fotoNoDisponible) {
      return null;
    }

    return this.construirFotoUrl(
      this.perfil?.fotoUrl ?? null
    );
  }

  manejarErrorFoto(): void {
    this.fotoNoDisponible = true;
  }

  obtenerIniciales(): string {
    const nombre =
      this.perfil?.nombre?.trim();

    if (!nombre) {
      return 'AD';
    }

    const partes = nombre
      .split(/\s+/)
      .filter(
        parte => parte.length > 0
      );

    if (partes.length === 1) {
      return partes[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${partes[0][0]}${partes[1][0]}`
      .toUpperCase();
  }

  /* =========================================================
     FECHAS
     ========================================================= */

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

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Bogota',
      }
    ).format(valor);
  }

  /* =========================================================
     MENSAJES
     ========================================================= */

  cerrarError(): void {
    this.errorMessage = '';
    this.hasError = false;
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
            message =>
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
        return 'No fue posible conectarse con el servidor. Verifica que la API esté disponible.';

      case 400:
        return 'La solicitud para consultar el perfil no es válida.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

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

  /* =========================================================
     URL DE LA FOTOGRAFÍA
     ========================================================= */

  private construirFotoUrl(
    fotoUrl: string | null
  ): string | null {
    if (!fotoUrl) {
      return null;
    }

    const ruta = fotoUrl.trim();

    if (!ruta) {
      return null;
    }

    if (
      ruta.startsWith('http://') ||
      ruta.startsWith('https://') ||
      ruta.startsWith('data:') ||
      ruta.startsWith('blob:')
    ) {
      return ruta;
    }

    const rutaNormalizada =
      ruta.startsWith('/')
        ? ruta
        : `/${ruta}`;

    return `${this.apiBaseUrl}${rutaNormalizada}`;
  }
}