import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ZonaComunResponse,
  ZonaComunService,
} from '../../../../core/services/ZonaComun/zona-comun';

import {
  HorarioOcupadoZonaComunResponse,
  RegistrarReservaZonaComunRequest,
  ReservaZonaComunResponse,
  ReservaZonaComunService,
} from '../../../../core/services/ReservaZonaComun/reservazona-comun';

import {
  obtenerAnioActualColombia,
  obtenerFechaHoyColombia,
  obtenerMesActualColombia,
} from '../../../../core/utils/colombia-date.util';

@Component({
  selector: 'app-form-reservas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-reservas.html',
  styleUrl: './form-reservas.css',
})
export class FormReservas implements OnInit {

  @Output() guardado =
    new EventEmitter<ReservaZonaComunResponse>();

  @Output() cerrar =
    new EventEmitter<void>();

  zonas: ZonaComunResponse[] = [];
  horariosOcupados: HorarioOcupadoZonaComunResponse[] = [];

  zonaComunId = '';
  fechaReserva = '';
  horaInicio = '';
  horaFin = '';
  cantidadPersonas: number | null = null;
  observacion = '';

  fechaMinima = '';
  fechaMaxima = '';

  isLoadingZones = false;
  isLoadingAvailability = false;
  isSubmitting = false;

  zonesErrorMessage = '';
  availabilityErrorMessage = '';
  errorMessage = '';

  constructor(
    private readonly zonaComunService: ZonaComunService,
    private readonly reservaZonaComunService: ReservaZonaComunService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.establecerRangoFechas();
    this.cargarZonas();
  }

  get zonaSeleccionada(): ZonaComunResponse | null {
    return this.zonas.find(
      (zona) => zona.id === this.zonaComunId,
    ) ?? null;
  }

  get puedeConsultarDisponibilidad(): boolean {
    return Boolean(
      this.zonaComunId &&
      this.fechaReserva,
    );
  }

  get puedeGuardar(): boolean {
    return (
      !this.isSubmitting &&
      !this.isLoadingZones &&
      !this.isLoadingAvailability &&
      Boolean(this.zonaComunId) &&
      Boolean(this.fechaReserva) &&
      Boolean(this.horaInicio) &&
      Boolean(this.horaFin) &&
      Boolean(this.cantidadPersonas)
    );
  }

  get horariosOcupadosOrdenados():
    HorarioOcupadoZonaComunResponse[] {
    return [...this.horariosOcupados].sort(
      (a, b) =>
        a.horaInicio.localeCompare(
          b.horaInicio,
        ),
    );
  }

  cargarZonas(): void {
    if (this.isLoadingZones) {
      return;
    }

    this.isLoadingZones = true;
    this.zonesErrorMessage = '';

    this.zonaComunService
      .obtenerActivas()
      .pipe(
        finalize(() => {
          this.isLoadingZones = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.zonas = response ?? [];
        },
        error: (error) => {
          this.zonas = [];

          this.zonesErrorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible cargar las zonas comunes disponibles.',
            );
        },
      });
  }

  seleccionarZona(): void {
    this.limpiarMensajesReserva();
    this.limpiarHorarioSeleccionado();
    this.horariosOcupados = [];

    const zona = this.zonaSeleccionada;

    if (!zona) {
      this.cantidadPersonas = null;
      this.cdr.detectChanges();
      return;
    }

    if (
      this.cantidadPersonas !== null &&
      this.cantidadPersonas >
        zona.capacidadMaxima
    ) {
      this.cantidadPersonas = null;
    }

    this.consultarDisponibilidadSiEsPosible();
  }

  seleccionarFecha(): void {
    this.limpiarMensajesReserva();
    this.limpiarHorarioSeleccionado();
    this.horariosOcupados = [];

    const validationMessage =
      this.validarFechaSeleccionada();

    if (validationMessage) {
      this.availabilityErrorMessage =
        validationMessage;

      this.cdr.detectChanges();
      return;
    }

    this.consultarDisponibilidadSiEsPosible();
  }

  consultarDisponibilidad(): void {
    if (
      !this.puedeConsultarDisponibilidad ||
      this.isLoadingAvailability
    ) {
      return;
    }

    const dateValidation =
      this.validarFechaSeleccionada();

    if (dateValidation) {
      this.availabilityErrorMessage =
        dateValidation;

      this.cdr.detectChanges();
      return;
    }

    this.isLoadingAvailability = true;
    this.availabilityErrorMessage = '';
    this.horariosOcupados = [];

    this.reservaZonaComunService
      .obtenerHorariosOcupados(
        this.zonaComunId,
        this.fechaReserva,
      )
      .pipe(
        finalize(() => {
          this.isLoadingAvailability = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.horariosOcupados =
            response ?? [];
        },
        error: (error) => {
          this.horariosOcupados = [];

          this.availabilityErrorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible consultar los horarios ocupados.',
            );
        },
      });
  }

  cambiarHoraInicio(): void {
    this.errorMessage = '';

    if (
      this.horaFin &&
      this.horaInicio >= this.horaFin
    ) {
      this.horaFin = '';
    }

    this.cdr.detectChanges();
  }

  cambiarHoraFin(): void {
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  guardar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';

    const validationMessage =
      this.validarFormulario();

    if (validationMessage) {
      this.errorMessage = validationMessage;
      this.cdr.detectChanges();
      return;
    }

    const request:
      RegistrarReservaZonaComunRequest = {
        zonaComunId: this.zonaComunId,
        fechaReserva: this.fechaReserva,
        horaInicio: this.normalizarHora(
          this.horaInicio,
        ),
        horaFin: this.normalizarHora(
          this.horaFin,
        ),
        cantidadPersonas: Number(
          this.cantidadPersonas,
        ),
        observacion:
          this.normalizarObservacion(),
      };

    this.isSubmitting = true;

    this.reservaZonaComunService
      .registrar(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.guardado.emit(response);
          this.limpiarFormulario();
        },
        error: (error) => {
          this.errorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible registrar la reserva.',
            );

          this.cdr.detectChanges();
        },
      });
  }

  cancelar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarFormulario();
    this.cerrar.emit();
  }

  horarioEstaOcupado(
    horario: HorarioOcupadoZonaComunResponse,
  ): boolean {
    if (
      !this.horaInicio ||
      !this.horaFin
    ) {
      return false;
    }

    return this.hayCruceHorarios(
      this.horaInicio,
      this.horaFin,
      horario.horaInicio,
      horario.horaFin,
    );
  }

  seleccionarHorarioDisponible(
    horaInicio: string,
    horaFin: string,
  ): void {
    if (
      this.isLoadingAvailability ||
      this.isSubmitting
    ) {
      return;
    }

    this.horaInicio =
      this.formatearHoraInput(horaInicio);

    this.horaFin =
      this.formatearHoraInput(horaFin);

    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  formatearHoraVisual(
    hora: string,
  ): string {
    return this.formatearHoraInput(hora);
  }

  private consultarDisponibilidadSiEsPosible(): void {
    if (!this.puedeConsultarDisponibilidad) {
      return;
    }

    this.consultarDisponibilidad();
  }

  private validarFormulario(): string {
    const zona = this.zonaSeleccionada;

    if (!zona) {
      return 'Debes seleccionar una zona común.';
    }

    if (!zona.activa) {
      return 'La zona común seleccionada no se encuentra activa.';
    }

    const dateValidation =
      this.validarFechaSeleccionada();

    if (dateValidation) {
      return dateValidation;
    }

    if (!this.horaInicio) {
      return 'Debes seleccionar la hora de inicio.';
    }

    if (!this.horaFin) {
      return 'Debes seleccionar la hora de finalización.';
    }

    if (
      this.horaInicio >= this.horaFin
    ) {
      return 'La hora de inicio debe ser anterior a la hora de finalización.';
    }

    const apertura =
      this.formatearHoraInput(
        zona.horaApertura,
      );

    const cierre =
      this.formatearHoraInput(
        zona.horaCierre,
      );

    if (this.horaInicio < apertura) {
      return `La reserva no puede comenzar antes de las ${apertura}.`;
    }

    if (this.horaFin > cierre) {
      return `La reserva no puede finalizar después de las ${cierre}.`;
    }

    const duracionReserva =
      this.calcularDiferenciaMinutos(
        this.horaInicio,
        this.horaFin,
      );

    if (duracionReserva <= 0) {
      return 'La duración de la reserva no es válida.';
    }

    if (
      duracionReserva >
      zona.duracionMaximaMinutos
    ) {
      return `La duración máxima permitida para esta zona es de ${zona.duracionMaximaMinutos} minutos.`;
    }

    const cantidadPersonas =
      Number(this.cantidadPersonas);

    if (
      !Number.isInteger(cantidadPersonas) ||
      cantidadPersonas <= 0
    ) {
      return 'La cantidad de personas debe ser un número entero mayor que cero.';
    }

    if (
      cantidadPersonas >
      zona.capacidadMaxima
    ) {
      return `La capacidad máxima de esta zona es de ${zona.capacidadMaxima} personas.`;
    }

    if (
      this.existeCruceConHorarioOcupado()
    ) {
      return 'El horario seleccionado se cruza con una reserva existente.';
    }

    if (
      this.observacion.trim().length >
      500
    ) {
      return 'La observación no puede superar los 500 caracteres.';
    }

    return '';
  }

  private validarFechaSeleccionada(): string {
    if (!this.fechaReserva) {
      return 'Debes seleccionar la fecha de la reserva.';
    }

    if (
      this.fechaReserva <
      this.fechaMinima
    ) {
      return 'No puedes reservar en una fecha anterior al día de hoy.';
    }

    if (
      this.fechaReserva >
      this.fechaMaxima
    ) {
      return 'Solo puedes reservar dentro del mes actual.';
    }

    if (
      this.fechaReserva.substring(0, 7) !==
      this.fechaMinima.substring(0, 7)
    ) {
      return 'La fecha seleccionada debe pertenecer al mes actual.';
    }

    return '';
  }

  private existeCruceConHorarioOcupado(): boolean {
    return this.horariosOcupados.some(
      (horario) =>
        this.hayCruceHorarios(
          this.horaInicio,
          this.horaFin,
          horario.horaInicio,
          horario.horaFin,
        ),
    );
  }

  private hayCruceHorarios(
    inicioSeleccionado: string,
    finSeleccionado: string,
    inicioOcupado: string,
    finOcupado: string,
  ): boolean {
    const inicioReserva =
      this.convertirHoraAMinutos(
        inicioSeleccionado,
      );

    const finReserva =
      this.convertirHoraAMinutos(
        finSeleccionado,
      );

    const inicioExistente =
      this.convertirHoraAMinutos(
        inicioOcupado,
      );

    const finExistente =
      this.convertirHoraAMinutos(
        finOcupado,
      );

    return (
      inicioReserva < finExistente &&
      finReserva > inicioExistente
    );
  }

  private calcularDiferenciaMinutos(
    horaInicio: string,
    horaFin: string,
  ): number {
    return (
      this.convertirHoraAMinutos(
        horaFin,
      ) -
      this.convertirHoraAMinutos(
        horaInicio,
      )
    );
  }

  private convertirHoraAMinutos(
    hora: string,
  ): number {
    const horaNormalizada =
      this.formatearHoraInput(hora);

    const [horas, minutos] =
      horaNormalizada
        .split(':')
        .map(Number);

    return horas * 60 + minutos;
  }

  private establecerRangoFechas(): void {
    const year =
      obtenerAnioActualColombia();

    const month =
      obtenerMesActualColombia();

    this.fechaMinima =
      obtenerFechaHoyColombia();

    const ultimoDia =
      new Date(
        Date.UTC(year, month, 0)
      ).getUTCDate();

    this.fechaMaxima =
      `${year}-${String(month).padStart(2, '0')}-${String(
        ultimoDia
      ).padStart(2, '0')}`;
  }

  private normalizarHora(
    hora: string,
  ): string {
    return hora.length === 5
      ? `${hora}:00`
      : hora;
  }

  private formatearHoraInput(
    hora: string,
  ): string {
    if (!hora) {
      return '';
    }

    return hora.substring(0, 5);
  }

  private normalizarObservacion():
    string | null {
    const observacionNormalizada =
      this.observacion.trim();

    return observacionNormalizada || null;
  }

  private limpiarHorarioSeleccionado(): void {
    this.horaInicio = '';
    this.horaFin = '';
  }

  private limpiarMensajesReserva(): void {
    this.errorMessage = '';
    this.availabilityErrorMessage = '';
  }

  private limpiarFormulario(): void {
    this.zonaComunId = '';
    this.fechaReserva = '';
    this.horaInicio = '';
    this.horaFin = '';
    this.cantidadPersonas = null;
    this.observacion = '';

    this.horariosOcupados = [];

    this.zonesErrorMessage = '';
    this.availabilityErrorMessage = '';
    this.errorMessage = '';
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
        return validationMessages.join(' ');
      }
    }

    return fallbackMessage;
  }
}