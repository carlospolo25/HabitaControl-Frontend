import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import {
  PaqueteDetalleResponse,
  PaqueteService,
} from '../../../../core/services/paquete/paquete';

@Component({
  selector: 'app-detalle-paquete-notificacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-paque-notificaciones.html',
  styleUrl: './detalle-paque-notificaciones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetallePaqueteNotificacionComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly backendUrl =
  'https://localhost:7232';

  @Input() paqueteId: string | null = null;

  @Output() cerrar = new EventEmitter<void>();

  paqueteDetalle: PaqueteDetalleResponse | null = null;

  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly paqueteService: PaqueteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['paqueteId'] &&
      this.paqueteId
    ) {
      this.cargarDetalle();
    }
  }

  cargarDetalle(): void {
    const paqueteIdNormalizado = this.paqueteId?.trim();

    if (
      !paqueteIdNormalizado ||
      this.isLoading
    ) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.paqueteDetalle = null;

    this.paqueteService
      .obtenerDetalle(paqueteIdNormalizado)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: PaqueteDetalleResponse) => {
          this.paqueteDetalle = response;
        },

        error: (error: HttpErrorResponse) => {
          this.paqueteDetalle = null;

          this.errorMessage = this.obtenerMensajeError(
            error,
            'No fue posible cargar el detalle del paquete.'
          );
        },
      });
  }

  obtenerFotoUrl(
    fotoUrl: string | null | undefined
  ): string | null {
    if (!fotoUrl) {
      return null;
    }

    const url = fotoUrl.trim();

    if (!url) {
      return null;
    }

    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }

    return `${this.backendUrl}${
      url.startsWith('/') ? '' : '/'
    }${url}`;
  }

  tieneFoto(): boolean {
    return Boolean(
      this.paqueteDetalle?.fotoUrl?.trim()
    );
  }

  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.cerrar.emit();
  }

  detenerPropagacion(event: MouseEvent): void {
    event.stopPropagation();
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    if (error.status === 0) {
      return 'No fue posible conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    }

    const mensajeBackend =
      this.extraerMensajeBackend(error);

    if (mensajeBackend) {
      return mensajeBackend;
    }

    switch (error.status) {
      case 400:
        return 'El identificador del paquete no es válido.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para consultar este paquete.';

      case 404:
        return 'El paquete no existe o no tienes permisos para consultarlo.';

      case 409:
        return 'No fue posible consultar el paquete por su estado actual.';

      case 500:
        return 'Ocurrió un error interno al consultar el paquete. Inténtalo nuevamente.';

      default:
        return mensajePredeterminado;
    }
  }

  private extraerMensajeBackend(
    error: HttpErrorResponse
  ): string | null {
    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error.trim();
    }

    const posiblesMensajes = [
      error.error?.message,
      error.error?.mensaje,
      error.error?.detail,
      error.error?.title,
    ];

    const mensaje = posiblesMensajes.find(
      (valor): valor is string =>
        typeof valor === 'string' &&
        valor.trim().length > 0
    );

    if (mensaje) {
      return mensaje.trim();
    }

    if (error.error?.errors) {
      const mensajes = Object.values(
        error.error.errors
      )
        .flat()
        .filter(
          (valor): valor is string =>
            typeof valor === 'string' &&
            valor.trim().length > 0
        )
        .map((valor) => valor.trim());

      if (mensajes.length > 0) {
        return mensajes.join(' ');
      }
    }

    return null;
  }
}