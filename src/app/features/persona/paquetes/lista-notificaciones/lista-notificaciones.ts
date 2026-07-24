import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {DetallePaqueteNotificacionComponent} from '../detalle-paque-notificaciones/detalle-paque-notificaciones'
import {
  NotificacionResponse,
  PaqueteDetalleResponse,
  PaqueteService,
} from '../../../../core/services/paquete/paquete';

@Component({
  selector: 'app-lista-notificaciones',
  standalone: true,
  imports: [CommonModule, DetallePaqueteNotificacionComponent],
  templateUrl: './lista-notificaciones.html',
  styleUrl: './lista-notificaciones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaNotificacionesComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  paqueteIdSeleccionado: string | null = null;
  mostrarDetallePaquete = false;
  notificaciones: NotificacionResponse[] = [];

  paqueteDetalle: PaqueteDetalleResponse | null = null;

  isLoading = false;
  isLoadingDetalle = false;

  errorMessage = '';
  detalleErrorMessage = '';

  constructor(
    private readonly paqueteService: PaqueteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  get totalNotificaciones(): number {
    return this.notificaciones.length;
  }

  get totalNoLeidas(): number {
    return this.notificaciones.filter(
      (notificacion) => !notificacion.leida
    ).length;
  }

  cargarNotificaciones(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.paqueteService
      .obtenerMisNotificaciones()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response: NotificacionResponse[]) => {
          this.notificaciones = response ?? [];
        },

        error: (error: HttpErrorResponse) => {
          this.notificaciones = [];

          this.errorMessage = this.obtenerMensajeError(
            error,
            'No fue posible cargar tus notificaciones.'
          );
        },
      });
  }

  verPaquete(
    paqueteId: string | null | undefined
  ): void {
    const idNormalizado = paqueteId?.trim();

    if (!idNormalizado || this.isLoadingDetalle) {
      return;
    }

    this.paqueteIdSeleccionado = idNormalizado;
    this.mostrarDetallePaquete = true;
    this.paqueteDetalle = null;
    this.detalleErrorMessage = '';

    this.cargarDetallePaquete(idNormalizado);
  }

  reintentarDetallePaquete(): void {
    if (
      !this.paqueteIdSeleccionado ||
      this.isLoadingDetalle
    ) {
      return;
    }

    this.cargarDetallePaquete(
      this.paqueteIdSeleccionado
    );
  }

  cerrarDetallePaquete(): void {
    if (this.isLoadingDetalle) {
      return;
    }

    this.mostrarDetallePaquete = false;
    this.paqueteDetalle = null;
    this.paqueteIdSeleccionado = null;
    this.detalleErrorMessage = '';

    this.cdr.markForCheck();
  }

  trackByNotificacion(
    _index: number,
    notificacion: NotificacionResponse
  ): string {
    return notificacion.id;
  }

  private cargarDetallePaquete(
    paqueteId: string
  ): void {
    this.isLoadingDetalle = true;
    this.paqueteDetalle = null;
    this.detalleErrorMessage = '';

    this.paqueteService
      .obtenerDetalle(paqueteId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoadingDetalle = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (
          response: PaqueteDetalleResponse
        ) => {
          this.paqueteDetalle = response;
        },

        error: (error: HttpErrorResponse) => {
          this.paqueteDetalle = null;

          this.detalleErrorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar el detalle del paquete.'
            );
        },
      });
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
        return 'La solicitud contiene información inválida.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para consultar esta información.';

      case 404:
        return 'La información solicitada no fue encontrada.';

      case 409:
        return 'No fue posible completar la operación por el estado actual del paquete.';

      case 500:
        return 'Ocurrió un error interno al procesar la solicitud. Inténtalo nuevamente.';

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