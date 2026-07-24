import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  CancelarReservaZonaComunRequest,
  ReservaZonaComunResponse,
  ReservaZonaComunService,
} from '../../../../core/services/ReservaZonaComun/reservazona-comun';

import { FormReservas } from '../form-reservas/form-reservas';

type FiltroEstadoReserva =
  | 'todas'
  | 'pendientes'
  | 'aprobadas'
  | 'rechazadas'
  | 'canceladas'
  | 'finalizadas';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormReservas,
  ],
  templateUrl: './mis-reservas.html',
  styleUrl: './mis-reservas.css',
})
export class MisReservasComponent implements OnInit {

  reservas: ReservaZonaComunResponse[] = [];

  reservaSeleccionada: ReservaZonaComunResponse | null = null;
  reservaParaCancelar: ReservaZonaComunResponse | null = null;

  mostrarFormulario = false;
  mostrarDetalle = false;
  mostrarCancelacion = false;

  motivoCancelacion = '';

  searchTerm = '';

  statusFilter: FiltroEstadoReserva = 'todas';

  isLoading = false;
  isLoadingDetail = false;
  isCancelling = false;

  reservaProcesandoId: string | null = null;

  errorMessage = '';
  detailErrorMessage = '';
  cancellationErrorMessage = '';
  successMessage = '';

  constructor(
    private readonly reservaZonaComunService: ReservaZonaComunService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarReservas();
  }

  get reservasFiltradas(): ReservaZonaComunResponse[] {
    const search = this.normalizarTexto(
      this.searchTerm,
    );

    return this.reservas.filter((reserva) => {
      const matchesSearch =
        !search ||
        this.normalizarTexto(
          reserva.zonaComunNombre,
        ).includes(search) ||
        this.normalizarTexto(
          reserva.estado,
        ).includes(search) ||
        this.normalizarTexto(
          reserva.observacion ?? '',
        ).includes(search) ||
        this.normalizarTexto(
          reserva.fechaReserva,
        ).includes(search);

      const matchesStatus =
        this.coincideFiltroEstado(
          reserva,
        );

      return matchesSearch && matchesStatus;
    });
  }

  get totalPendientes(): number {
    return this.contarPorEstado(
      'pendiente',
    );
  }

  get totalAprobadas(): number {
    return this.reservas.filter(
      (reserva) => {
        const estado =
          this.normalizarTexto(
            reserva.estado,
          );

        return (
          estado === 'aprobada' ||
          estado === 'aprobado' ||
          estado === 'confirmada' ||
          estado === 'confirmado'
        );
      },
    ).length;
  }

  get totalRechazadas(): number {
    return this.contarPorEstado(
      'rechazada',
    );
  }

  get totalCanceladas(): number {
    return this.contarPorEstado(
      'cancelada',
    );
  }

  get totalFinalizadas(): number {
    return this.contarPorEstado(
      'finalizada',
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
      .obtenerMisReservas()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.reservas = this.ordenarReservas(
            response ?? [],
          );
        },
        error: (error) => {
          this.reservas = [];

          this.errorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar tus reservas.',
            );
        },
      });
  }

  recargar(): void {
    this.cargarReservas();
  }

  abrirFormulario(): void {
    if (
      this.isLoading ||
      this.isLoadingDetail ||
      this.isCancelling ||
      this.reservaProcesandoId !== null
    ) {
      return;
    }

    this.limpiarMensajes();

    this.mostrarFormulario = true;
    this.cdr.detectChanges();
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.cdr.detectChanges();
  }

  reservaGuardada(
    reserva: ReservaZonaComunResponse,
  ): void {
    const yaExiste = this.reservas.some(
      (item) => item.id === reserva.id,
    );

    if (yaExiste) {
      this.actualizarReservaEnListado(
        reserva,
      );
    } else {
      this.reservas = this.ordenarReservas([
        reserva,
        ...this.reservas,
      ]);
    }

    this.successMessage =
      reserva.estado
        ? `La reserva fue registrada correctamente con estado ${reserva.estado}.`
        : 'La reserva fue registrada correctamente.';

    this.cerrarFormulario();
    this.cdr.detectChanges();
  }

  verDetalle(
    reservaId: string,
  ): void {
    if (
      !reservaId ||
      this.isLoadingDetail ||
      this.isCancelling
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

  abrirCancelacion(
    reserva: ReservaZonaComunResponse,
  ): void {
    if (
      !this.puedeCancelar(reserva) ||
      this.isCancelling ||
      this.reservaProcesandoId !== null
    ) {
      return;
    }

    this.limpiarMensajes();

    this.reservaParaCancelar = reserva;
    this.motivoCancelacion = '';
    this.mostrarCancelacion = true;

    this.cdr.detectChanges();
  }

  cancelarDesdeDetalle(): void {
    if (!this.reservaSeleccionada) {
      return;
    }

    const reserva =
      this.reservaSeleccionada;

    this.cerrarDetalle();
    this.abrirCancelacion(reserva);
  }

  cerrarCancelacion(forzar = false): void {
    if (this.isCancelling && !forzar) {
      return;
    }

    this.mostrarCancelacion = false;
    this.reservaParaCancelar = null;
    this.motivoCancelacion = '';
    this.cancellationErrorMessage = '';

    this.cdr.detectChanges();
  }

  confirmarCancelacion(): void {
    if (
      !this.reservaParaCancelar ||
      this.isCancelling
    ) {
      return;
    }

    this.cancellationErrorMessage = '';
    this.successMessage = '';

    const motivo =
      this.motivoCancelacion.trim();

    if (!motivo) {
      this.cancellationErrorMessage =
        'Debes indicar el motivo de la cancelación.';

      this.cdr.detectChanges();
      return;
    }

    if (motivo.length < 5) {
      this.cancellationErrorMessage =
        'El motivo debe tener al menos 5 caracteres.';

      this.cdr.detectChanges();
      return;
    }

    if (motivo.length > 500) {
      this.cancellationErrorMessage =
        'El motivo no puede superar los 500 caracteres.';

      this.cdr.detectChanges();
      return;
    }

    const reservaId =
      this.reservaParaCancelar.id;

    const request:
      CancelarReservaZonaComunRequest = {
        motivo,
      };

    this.isCancelling = true;
    this.reservaProcesandoId = reservaId;

    this.reservaZonaComunService
      .cancelar(reservaId, request)
      .pipe(
        finalize(() => {
          this.isCancelling = false;
          this.reservaProcesandoId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.actualizarReservaEnListado(response);

          if (
            this.reservaSeleccionada?.id === response.id
          ) {
            this.reservaSeleccionada = response;
          }

          this.successMessage =
            'La reserva fue cancelada correctamente.';

          this.cerrarCancelacion(true);
        },
        error: (error) => {
          this.cancellationErrorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible cancelar la reserva.',
            );

          this.cdr.detectChanges();
        },
      });
  }

  puedeCancelar(
    reserva: ReservaZonaComunResponse,
  ): boolean {
    const estado =
      this.normalizarTexto(
        reserva.estado,
      );

    const estadosNoCancelables = [
      'cancelada',
      'cancelado',
      'rechazada',
      'rechazado',
      'finalizada',
      'finalizado',
    ];

    if (
      estadosNoCancelables.includes(
        estado,
      )
    ) {
      return false;
    }

    return !this.reservaYaPaso(
      reserva,
    );
  }

  reservaYaPaso(
    reserva: ReservaZonaComunResponse,
  ): boolean {
    if (
      !reserva.fechaReserva ||
      !reserva.horaFin
    ) {
      return false;
    }

    const fechaHoraFin =
      this.construirFechaHoraLocal(
        reserva.fechaReserva,
        reserva.horaFin,
      );

    return fechaHoraFin.getTime() <=
      Date.now();
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
    if (
      this.statusFilter === 'todas'
    ) {
      return true;
    }

    const estado =
      this.normalizarTexto(
        reserva.estado,
      );

    switch (this.statusFilter) {
      case 'pendientes':
        return (
          estado === 'pendiente' ||
          estado === 'pendiente de aprobacion'
        );

      case 'aprobadas':
        return (
          estado === 'aprobada' ||
          estado === 'aprobado' ||
          estado === 'confirmada' ||
          estado === 'confirmado'
        );

      case 'rechazadas':
        return (
          estado === 'rechazada' ||
          estado === 'rechazado'
        );

      case 'canceladas':
        return (
          estado === 'cancelada' ||
          estado === 'cancelado'
        );

      case 'finalizadas':
        return (
          estado === 'finalizada' ||
          estado === 'finalizado'
        );

      default:
        return true;
    }
  }

  private contarPorEstado(
    estadoBuscado: string,
  ): number {
    return this.reservas.filter(
      (reserva) =>
        this.normalizarTexto(
          reserva.estado,
        ) === estadoBuscado,
    ).length;
  }

  private actualizarReservaEnListado(
    reservaActualizada:
      ReservaZonaComunResponse,
  ): void {
    this.reservas = this.ordenarReservas(
      this.reservas.map((reserva) =>
        reserva.id ===
        reservaActualizada.id
          ? reservaActualizada
          : reserva,
      ),
    );
  }

  private ordenarReservas(
    reservas:
      ReservaZonaComunResponse[],
  ): ReservaZonaComunResponse[] {
    return [...reservas].sort(
      (a, b) => {
        const fechaA =
          this.construirFechaHoraLocal(
            a.fechaReserva,
            a.horaInicio,
          ).getTime();

        const fechaB =
          this.construirFechaHoraLocal(
            b.fechaReserva,
            b.horaInicio,
          ).getTime();

        return fechaB - fechaA;
      },
    );
  }

  private construirFechaHoraLocal(
    fecha: string,
    hora: string,
  ): Date {
    const fechaNormalizada =
      fecha.substring(0, 10);

    const horaNormalizada =
      hora.substring(0, 5);

    const [
      year,
      month,
      day,
    ] = fechaNormalizada
      .split('-')
      .map(Number);

    const [
      hours,
      minutes,
    ] = horaNormalizada
      .split(':')
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      0,
      0,
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
    this.cancellationErrorMessage = '';
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