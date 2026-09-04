import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ReservaZonaComunResponse,
  ReservaZonaComunService,
  RevisarReservaZonaComunRequest,
} from '../../../../core/services/ReservaZonaComun/reservazona-comun';

type FiltroEstadoReserva =
  | 'todas'
  | 'pendientes'
  | 'aprobadas'
  | 'rechazadas'
  | 'canceladas'
  | 'finalizadas';

type DecisionRevision =
  | 'aprobar'
  | 'rechazar'
  | null;

@Component({
  selector: 'app-gestion-reservas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './gestion-reservas.html',
  styleUrl: './gestion-reservas.css',
})
export class GestionReservasComponent implements OnInit {

  reservas: ReservaZonaComunResponse[] = [];

  reservaSeleccionada:
    ReservaZonaComunResponse | null = null;

  reservaParaRevisar:
    ReservaZonaComunResponse | null = null;

  mostrarDetalle = false;
  mostrarRevision = false;

  decisionRevision: DecisionRevision = null;
  observacionRevision = '';

  searchTerm = '';

  statusFilter: FiltroEstadoReserva = 'todas';

  isLoading = false;
  isLoadingDetail = false;
  isReviewing = false;

  reservaProcesandoId: string | null = null;

  errorMessage = '';
  detailErrorMessage = '';
  reviewErrorMessage = '';
  successMessage = '';

  constructor(
    private readonly reservaZonaComunService:
      ReservaZonaComunService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  get reservasFiltradas():
    ReservaZonaComunResponse[] {
    const search =
      this.normalizarTexto(this.searchTerm);

    return this.reservas.filter(
      (reserva) => {
        const matchesSearch =
          !search ||
          this.normalizarTexto(
            reserva.zonaComunNombre,
          ).includes(search) ||
          this.normalizarTexto(
            reserva.residenteNombre,
          ).includes(search) ||
          this.normalizarTexto(
            reserva.estado,
          ).includes(search) ||
          this.normalizarTexto(
            reserva.fechaReserva,
          ).includes(search) ||
          this.normalizarTexto(
            reserva.observacion ?? '',
          ).includes(search);

        const matchesStatus =
          this.coincideFiltroEstado(
            reserva,
          );

        return (
          matchesSearch &&
          matchesStatus
        );
      },
    );
  }

  get totalPendientes(): number {
    return this.reservas.filter(
      (reserva) =>
        this.esEstadoPendiente(
          reserva.estado,
        ),
    ).length;
  }

  get totalAprobadas(): number {
    return this.reservas.filter(
      (reserva) =>
        this.esEstadoAprobado(
          reserva.estado,
        ),
    ).length;
  }

  get totalRechazadas(): number {
    return this.reservas.filter(
      (reserva) =>
        this.esEstadoRechazado(
          reserva.estado,
        ),
    ).length;
  }

  get totalCanceladas(): number {
    return this.reservas.filter(
      (reserva) =>
        this.esEstadoCancelado(
          reserva.estado,
        ),
    ).length;
  }

  get totalFinalizadas(): number {
    return this.reservas.filter(
      (reserva) =>
        this.esEstadoFinalizado(
          reserva.estado,
        ),
    ).length;
  }

  get esAprobacion(): boolean {
    return (
      this.decisionRevision ===
      'aprobar'
    );
  }

  get esRechazo(): boolean {
    return (
      this.decisionRevision ===
      'rechazar'
    );
  }

  cargarReservas(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.reservaZonaComunService
      .obtenerTodas()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.reservas =
            this.ordenarReservas(
              response ?? [],
            );
        },
        error: (error) => {
          this.reservas = [];

          this.errorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar las solicitudes de reserva.',
            );
        },
      });
  }

  recargar(): void {
    this.cargarReservas();
  }

  verDetalle(
    reservaId: string,
  ): void {
    if (
      !reservaId ||
      this.isLoadingDetail ||
      this.isReviewing
    ) {
      return;
    }

    this.isLoadingDetail = true;
    this.detailErrorMessage = '';
    this.successMessage = '';
    this.reservaSeleccionada = null;
    this.mostrarDetalle = true;

    this.reservaZonaComunService
      .obtenerPorId(reservaId)
      .pipe(
        finalize(() => {
          this.isLoadingDetail = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.reservaSeleccionada =
            response;
        },
        error: (error) => {
          this.detailErrorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible consultar el detalle de la reserva.',
            );
        },
      });
  }

  cerrarDetalle(): void {
    if (this.isLoadingDetail) {
      return;
    }

    this.mostrarDetalle = false;
    this.reservaSeleccionada = null;
    this.detailErrorMessage = '';

    this.cdr.detectChanges();
  }

  abrirRevision(
    reserva: ReservaZonaComunResponse,
    decision: Exclude<
      DecisionRevision,
      null
    >,
  ): void {
    if (
      !this.puedeRevisar(reserva) ||
      this.isReviewing ||
      this.reservaProcesandoId !== null
    ) {
      return;
    }

    this.limpiarMensajes();

    this.reservaParaRevisar = reserva;
    this.decisionRevision = decision;
    this.observacionRevision = '';
    this.mostrarRevision = true;

    this.cdr.detectChanges();
  }

  revisarDesdeDetalle(
    decision: Exclude<
      DecisionRevision,
      null
    >,
  ): void {
    if (!this.reservaSeleccionada) {
      return;
    }

    const reserva =
      this.reservaSeleccionada;

    this.cerrarDetalle();
    this.abrirRevision(
      reserva,
      decision,
    );
  }

  cambiarDecision(
    decision: Exclude<
      DecisionRevision,
      null
    >,
  ): void {
    if (this.isReviewing) {
      return;
    }

    this.decisionRevision = decision;
    this.reviewErrorMessage = '';

    this.cdr.detectChanges();
  }

  cerrarRevision(
    forzar = false,
  ): void {
    if (
      this.isReviewing &&
      !forzar
    ) {
      return;
    }

    this.mostrarRevision = false;
    this.reservaParaRevisar = null;
    this.decisionRevision = null;
    this.observacionRevision = '';
    this.reviewErrorMessage = '';

    this.cdr.detectChanges();
  }

  confirmarRevision(): void {
    if (
      !this.reservaParaRevisar ||
      !this.decisionRevision ||
      this.isReviewing
    ) {
      return;
    }

    this.reviewErrorMessage = '';
    this.successMessage = '';

    const observacion =
      this.observacionRevision.trim();

    if (
      this.esRechazo &&
      !observacion
    ) {
      this.reviewErrorMessage =
        'Debes indicar el motivo del rechazo.';

      this.cdr.detectChanges();
      return;
    }

    if (
      this.esRechazo &&
      observacion.length < 5
    ) {
      this.reviewErrorMessage =
        'El motivo del rechazo debe tener al menos 5 caracteres.';

      this.cdr.detectChanges();
      return;
    }

    if (
      observacion.length > 500
    ) {
      this.reviewErrorMessage =
        'La observación no puede superar los 500 caracteres.';

      this.cdr.detectChanges();
      return;
    }

    const reservaId =
      this.reservaParaRevisar.id;

    const request:
      RevisarReservaZonaComunRequest = {
        aprobar: this.esAprobacion,
        observacion:
          observacion || null,
      };

    this.isReviewing = true;
    this.reservaProcesandoId =
      reservaId;

    this.reservaZonaComunService
      .revisar(
        reservaId,
        request,
      )
      .pipe(
        finalize(() => {
          this.isReviewing = false;
          this.reservaProcesandoId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.actualizarReservaEnListado(
            response,
          );

          if (
            this.reservaSeleccionada?.id ===
            response.id
          ) {
            this.reservaSeleccionada =
              response;
          }

          this.successMessage =
            request.aprobar
              ? 'La solicitud fue aprobada correctamente.'
              : 'La solicitud fue rechazada correctamente.';

          this.cerrarRevision(true);
        },
        error: (error) => {
          this.reviewErrorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible revisar la solicitud.',
            );

          this.cdr.detectChanges();
        },
      });
  }

  puedeRevisar(
    reserva: ReservaZonaComunResponse,
  ): boolean {
    return this.esEstadoPendiente(
      reserva.estado,
    );
  }

  estaProcesando(
    reservaId: string,
  ): boolean {
    return (
      this.reservaProcesandoId ===
      reservaId
    );
  }

  setStatusFilter(
    filter: FiltroEstadoReserva,
  ): void {
    this.statusFilter = filter;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'todas';
  }

  cerrarMensajeExito(): void {
    this.successMessage = '';
  }

  cerrarMensajeError(): void {
    this.errorMessage = '';
  }

  trackByReserva(
    _index: number,
    reserva: ReservaZonaComunResponse,
  ): string {
    return reserva.id;
  }

  private coincideFiltroEstado(
    reserva: ReservaZonaComunResponse,
  ): boolean {
    switch (this.statusFilter) {
      case 'todas':
        return true;

      case 'pendientes':
        return this.esEstadoPendiente(
          reserva.estado,
        );

      case 'aprobadas':
        return this.esEstadoAprobado(
          reserva.estado,
        );

      case 'rechazadas':
        return this.esEstadoRechazado(
          reserva.estado,
        );

      case 'canceladas':
        return this.esEstadoCancelado(
          reserva.estado,
        );

      case 'finalizadas':
        return this.esEstadoFinalizado(
          reserva.estado,
        );

      default:
        return true;
    }
  }

  private esEstadoPendiente(
    estado: string,
  ): boolean {
    const estadoNormalizado =
      this.normalizarTexto(estado);

    return (
      estadoNormalizado ===
        'pendiente' ||
      estadoNormalizado ===
        'pendiente de aprobacion'
    );
  }

  private esEstadoAprobado(
    estado: string,
  ): boolean {
    const estadoNormalizado =
      this.normalizarTexto(estado);

    return (
      estadoNormalizado ===
        'aprobada' ||
      estadoNormalizado ===
        'aprobado' ||
      estadoNormalizado ===
        'confirmada' ||
      estadoNormalizado ===
        'confirmado'
    );
  }

  private esEstadoRechazado(
    estado: string,
  ): boolean {
    const estadoNormalizado =
      this.normalizarTexto(estado);

    return (
      estadoNormalizado ===
        'rechazada' ||
      estadoNormalizado ===
        'rechazado'
    );
  }

  private esEstadoCancelado(
    estado: string,
  ): boolean {
    const estadoNormalizado =
      this.normalizarTexto(estado);

    return (
      estadoNormalizado ===
        'cancelada' ||
      estadoNormalizado ===
        'cancelado'
    );
  }

  private esEstadoFinalizado(
    estado: string,
  ): boolean {
    const estadoNormalizado =
      this.normalizarTexto(estado);

    return (
      estadoNormalizado ===
        'finalizada' ||
      estadoNormalizado ===
        'finalizado'
    );
  }

  private actualizarReservaEnListado(
    reservaActualizada:
      ReservaZonaComunResponse,
  ): void {
    this.reservas =
      this.ordenarReservas(
        this.reservas.map(
          (reserva) =>
            reserva.id ===
            reservaActualizada.id
              ? reservaActualizada
              : reserva,
        ),
      );
  }

  private ordenarReservas(
    reservas: ReservaZonaComunResponse[],
  ): ReservaZonaComunResponse[] {
    return [...reservas].sort(
      (a, b) => {
        const prioridadA =
          this.esEstadoPendiente(a.estado)
            ? 0
            : 1;

        const prioridadB =
          this.esEstadoPendiente(b.estado)
            ? 0
            : 1;

        if (prioridadA !== prioridadB) {
          return prioridadA - prioridadB;
        }

        const fechaHoraA =
          `${a.fechaReserva.substring(0, 10)}T${a.horaInicio.substring(0, 5)}`;

        const fechaHoraB =
          `${b.fechaReserva.substring(0, 10)}T${b.horaInicio.substring(0, 5)}`;

        return fechaHoraA.localeCompare(
          fechaHoraB
        );
      },
    );
  }

  private normalizarTexto(
    value: string,
  ): string {
    return value
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .trim()
      .toLowerCase();
  }

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.detailErrorMessage = '';
    this.reviewErrorMessage = '';
    this.successMessage = '';
  }

  private obtenerMensajeError(
    error: any,
    fallbackMessage: string,
  ): string {
    if (
      typeof error?.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (error?.error?.mensaje) {
      return error.error.mensaje;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.title) {
      return error.error.title;
    }

    if (error?.error?.errors) {
      const validationMessages =
        Object.values(
          error.error.errors,
        )
          .flat()
          .filter(
            (
              message,
            ): message is string =>
              typeof message === 'string' &&
              message.trim().length > 0,
          );

      if (
        validationMessages.length > 0
      ) {
        return validationMessages.join(
          ' ',
        );
      }
    }

    return fallbackMessage;
  }
}