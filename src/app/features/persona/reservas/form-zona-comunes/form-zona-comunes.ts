import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ActualizarZonaComunRequest,
  RegistrarZonaComunRequest,
  ZonaComunResponse,
  ZonaComunService,
} from '../../../../core/services/ZonaComun/zona-comun';

@Component({
  selector: 'app-form-zona-comunes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-zona-comunes.html',
  styleUrl: './form-zona-comunes.css',
})
export class FormZonaComunes implements OnChanges {

  @Input() zona: ZonaComunResponse | null = null;

  @Output() guardado =
    new EventEmitter<ZonaComunResponse>();

  @Output() cerrar =
    new EventEmitter<void>();

  nombre = '';
  descripcion = '';

  capacidadMaxima: number | null = null;
  duracionMaximaMinutos: number | null = null;

  horaApertura = '';
  horaCierre = '';

  requiereAprobacion = false;

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly zonaComunService: ZonaComunService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get esEdicion(): boolean {
    return this.zona !== null;
  }

  get tituloFormulario(): string {
    return this.esEdicion
      ? 'Editar zona común'
      : 'Crear zona común';
  }

  get textoBoton(): string {
    if (this.isSubmitting) {
      return this.esEdicion
        ? 'Guardando cambios...'
        : 'Creando zona...';
    }

    return this.esEdicion
      ? 'Guardar cambios'
      : 'Crear zona común';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['zona']) {
      this.cargarFormulario();
    }
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

    if (this.esEdicion && this.zona) {
      this.actualizarZona(this.zona.id);
      return;
    }

    this.registrarZona();
  }

  cancelar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarFormulario();
    this.cerrar.emit();
  }

  private registrarZona(): void {
    const request: RegistrarZonaComunRequest =
      this.construirRequest();

    this.isSubmitting = true;

    this.zonaComunService
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
              'No fue posible crear la zona común.',
            );

          this.cdr.detectChanges();
        },
      });
  }

  private actualizarZona(
    zonaComunId: string,
  ): void {
    const request: ActualizarZonaComunRequest =
      this.construirRequest();

    this.isSubmitting = true;

    this.zonaComunService
      .actualizar(zonaComunId, request)
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
              'No fue posible actualizar la zona común.',
            );

          this.cdr.detectChanges();
        },
      });
  }

  private cargarFormulario(): void {
    this.errorMessage = '';

    if (!this.zona) {
      this.limpiarFormulario();
      return;
    }

    this.nombre = this.zona.nombre;
    this.descripcion =
      this.zona.descripcion ?? '';

    this.capacidadMaxima =
      this.zona.capacidadMaxima;

    this.duracionMaximaMinutos =
      this.zona.duracionMaximaMinutos;

    this.horaApertura =
      this.formatearHoraInput(
        this.zona.horaApertura,
      );

    this.horaCierre =
      this.formatearHoraInput(
        this.zona.horaCierre,
      );

    this.requiereAprobacion =
      this.zona.requiereAprobacion;

    this.cdr.detectChanges();
  }

  private construirRequest():
    RegistrarZonaComunRequest {
    return {
      nombre: this.nombre.trim(),

      descripcion:
        this.normalizarDescripcion(),

      capacidadMaxima:
        Number(this.capacidadMaxima),

      horaApertura:
        this.normalizarHora(
          this.horaApertura,
        ),

      horaCierre:
        this.normalizarHora(
          this.horaCierre,
        ),

      duracionMaximaMinutos:
        Number(
          this.duracionMaximaMinutos,
        ),

      requiereAprobacion:
        this.requiereAprobacion,
    };
  }

  private validarFormulario(): string {
    const nombreNormalizado =
      this.nombre.trim();

    const descripcionNormalizada =
      this.descripcion.trim();

    const capacidad =
      Number(this.capacidadMaxima);

    const duracion =
      Number(
        this.duracionMaximaMinutos,
      );

    if (!nombreNormalizado) {
      return 'El nombre de la zona común es obligatorio.';
    }

    if (nombreNormalizado.length < 3) {
      return 'El nombre debe tener al menos 3 caracteres.';
    }

    if (nombreNormalizado.length > 150) {
      return 'El nombre no puede superar los 150 caracteres.';
    }

    if (
      descripcionNormalizada.length > 500
    ) {
      return 'La descripción no puede superar los 500 caracteres.';
    }

    if (
      !Number.isInteger(capacidad) ||
      capacidad <= 0
    ) {
      return 'La capacidad máxima debe ser un número entero mayor que cero.';
    }

    if (!this.horaApertura) {
      return 'La hora de apertura es obligatoria.';
    }

    if (!this.horaCierre) {
      return 'La hora de cierre es obligatoria.';
    }

    if (
      this.horaApertura >=
      this.horaCierre
    ) {
      return 'La hora de apertura debe ser anterior a la hora de cierre.';
    }

    if (
      !Number.isInteger(duracion) ||
      duracion <= 0
    ) {
      return 'La duración máxima debe ser un número entero mayor que cero.';
    }

    const minutosDisponibles =
      this.calcularDiferenciaMinutos(
        this.horaApertura,
        this.horaCierre,
      );

    if (duracion > minutosDisponibles) {
      return 'La duración máxima no puede superar el horario disponible de la zona.';
    }

    return '';
  }

  private calcularDiferenciaMinutos(
    horaInicio: string,
    horaFin: string,
  ): number {
    const [
      horaInicioNumero,
      minutoInicioNumero,
    ] = horaInicio
      .split(':')
      .map(Number);

    const [
      horaFinNumero,
      minutoFinNumero,
    ] = horaFin
      .split(':')
      .map(Number);

    const inicioEnMinutos =
      horaInicioNumero * 60 +
      minutoInicioNumero;

    const finEnMinutos =
      horaFinNumero * 60 +
      minutoFinNumero;

    return finEnMinutos -
      inicioEnMinutos;
  }

  private limpiarFormulario(): void {
    this.nombre = '';
    this.descripcion = '';

    this.capacidadMaxima = null;
    this.duracionMaximaMinutos = null;

    this.horaApertura = '';
    this.horaCierre = '';

    this.requiereAprobacion = false;
    this.errorMessage = '';
  }

  private normalizarDescripcion():
    string | null {
    const descripcionNormalizada =
      this.descripcion.trim();

    return descripcionNormalizada || null;
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