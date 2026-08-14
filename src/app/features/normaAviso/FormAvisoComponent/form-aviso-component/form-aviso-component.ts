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
  ActualizarAvisoRequest,
  AudienciaAviso,
  Aviso,
  AvisoResponse,
  CrearAvisoRequest,
  PrioridadAviso,
} from '../../../../core/services/avisos/aviso';

@Component({
  selector: 'app-form-aviso-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-aviso-component.html',
  styleUrl: './form-aviso-component.css',
})
export class FormAvisoComponent implements OnChanges {

  // =========================================================
  // INPUTS / OUTPUTS
  // =========================================================

  @Input() aviso: AvisoResponse | null = null;

  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  // =========================================================
  // FORMULARIO
  // =========================================================

  titulo = '';
  mensaje = '';

  prioridad: PrioridadAviso =
    PrioridadAviso.Informativo;

  audiencia: AudienciaAviso =
    AudienciaAviso.Todos;

  fechaPublicacion = '';
  fechaExpiracion = '';

  // =========================================================
  // ARCHIVO
  // =========================================================

  archivoSeleccionado: File | null = null;
  nombreArchivoSeleccionado = '';

  // =========================================================
  // ESTADOS
  // =========================================================

  isSubmitting = false;

  errorMessage = '';
  successMessage = '';

  // =========================================================
  // ENUMS
  // =========================================================

  readonly PrioridadAviso = PrioridadAviso;
  readonly AudienciaAviso = AudienciaAviso;

  // =========================================================
  // LÍMITES
  // =========================================================

  readonly maxTitulo = 150;
  readonly maxMensaje = 3000;

  readonly maxArchivoBytes =
    10 * 1024 * 1024;

  readonly tiposArchivoPermitidos = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  constructor(
    private readonly avisoService: Aviso,
    private readonly cdr: ChangeDetectorRef
  ) {}

  // =========================================================
  // CAMBIOS DEL INPUT
  // =========================================================

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (changes['aviso']) {
      this.cargarFormulario();
    }
  }

  // =========================================================
  // MODO
  // =========================================================

  get esEdicion(): boolean {
    return this.aviso !== null;
  }

  // =========================================================
  // CARGAR FORMULARIO
  // =========================================================

  private cargarFormulario(): void {
    this.limpiarMensajes();

    this.archivoSeleccionado = null;
    this.nombreArchivoSeleccionado = '';

    if (!this.aviso) {
      this.inicializarNuevoAviso();
      return;
    }

    this.titulo = this.aviso.titulo;
    this.mensaje = this.aviso.mensaje;

    this.prioridad = this.aviso.prioridad;
    this.audiencia = this.aviso.audiencia;

    this.fechaPublicacion =
      this.convertirFechaParaInput(
        this.aviso.fechaPublicacion
      );

    this.fechaExpiracion =
      this.aviso.fechaExpiracion
        ? this.convertirFechaParaInput(
            this.aviso.fechaExpiracion
          )
        : '';

    this.nombreArchivoSeleccionado =
      this.aviso.nombreArchivo ?? '';
  }

  // =========================================================
  // NUEVO AVISO
  // =========================================================

  private inicializarNuevoAviso(): void {
    this.titulo = '';
    this.mensaje = '';

    this.prioridad =
      PrioridadAviso.Informativo;

    this.audiencia =
      AudienciaAviso.Todos;

    this.fechaPublicacion =
      this.obtenerFechaActualParaInput();

    this.fechaExpiracion = '';

    this.archivoSeleccionado = null;
    this.nombreArchivoSeleccionado = '';
  }

  // =========================================================
  // ARCHIVO
  // =========================================================

  seleccionarArchivo(
    event: Event
  ): void {
    this.errorMessage = '';

    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.[0] ?? null;

    if (!archivo) {
      return;
    }

    if (
      !this.tiposArchivoPermitidos.includes(
        archivo.type
      )
    ) {
      this.errorMessage =
        'Solo se permiten archivos PDF, JPG, JPEG o PNG.';

      input.value = '';

      this.archivoSeleccionado = null;
      this.nombreArchivoSeleccionado = '';

      return;
    }

    if (
      archivo.size > this.maxArchivoBytes
    ) {
      this.errorMessage =
        'El archivo no puede superar los 10 MB.';

      input.value = '';

      this.archivoSeleccionado = null;
      this.nombreArchivoSeleccionado = '';

      return;
    }

    this.archivoSeleccionado = archivo;

    this.nombreArchivoSeleccionado =
      archivo.name;
  }

  quitarArchivo(): void {
    this.archivoSeleccionado = null;
    this.nombreArchivoSeleccionado = '';
  }

  // =========================================================
  // GUARDAR
  // =========================================================

  guardar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarMensajes();

    if (!this.validarFormulario()) {
      return;
    }

    if (this.esEdicion) {
      this.actualizarAviso();
      return;
    }

    this.crearAviso();
  }

  // =========================================================
  // CREAR
  // =========================================================

  private crearAviso(): void {
    const request: CrearAvisoRequest = {
      titulo: this.titulo.trim(),
      mensaje: this.mensaje.trim(),

      prioridad: this.prioridad,
      audiencia: this.audiencia,

      fechaPublicacion:
        new Date(
          this.fechaPublicacion
        ).toISOString(),

      fechaExpiracion:
        this.fechaExpiracion
          ? new Date(
              this.fechaExpiracion
            ).toISOString()
          : null,
    };

    this.isSubmitting = true;

    this.avisoService
      .crear(
        request,
        this.archivoSeleccionado
      )
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'El aviso fue publicado correctamente.';

          this.guardado.emit();
        },

        error: (error) => {
          console.error(
            'Error creando aviso:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible publicar el aviso.';
        },
      });
  }

  // =========================================================
  // ACTUALIZAR
  // =========================================================

  private actualizarAviso(): void {
    if (!this.aviso) {
      return;
    }

    const request: ActualizarAvisoRequest = {
      titulo: this.titulo.trim(),
      mensaje: this.mensaje.trim(),

      prioridad: this.prioridad,
      audiencia: this.audiencia,

      fechaPublicacion:
        new Date(
          this.fechaPublicacion
        ).toISOString(),

      fechaExpiracion:
        this.fechaExpiracion
          ? new Date(
              this.fechaExpiracion
            ).toISOString()
          : null,
    };

    this.isSubmitting = true;

    this.avisoService
      .actualizar(
        this.aviso.id,
        request,
        this.archivoSeleccionado
      )
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'El aviso fue actualizado correctamente.';

          this.guardado.emit();
        },

        error: (error) => {
          console.error(
            'Error actualizando aviso:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible actualizar el aviso.';
        },
      });
  }

  // =========================================================
  // VALIDACIÓN
  // =========================================================

  private validarFormulario(): boolean {
    const titulo =
      this.titulo.trim();

    const mensaje =
      this.mensaje.trim();

    if (!titulo) {
      this.errorMessage =
        'El título del aviso es obligatorio.';

      return false;
    }

    if (
      titulo.length > this.maxTitulo
    ) {
      this.errorMessage =
        `El título no puede superar los ${this.maxTitulo} caracteres.`;

      return false;
    }

    if (!mensaje) {
      this.errorMessage =
        'El mensaje del aviso es obligatorio.';

      return false;
    }

    if (
      mensaje.length > this.maxMensaje
    ) {
      this.errorMessage =
        `El mensaje no puede superar los ${this.maxMensaje} caracteres.`;

      return false;
    }

    if (!this.fechaPublicacion) {
      this.errorMessage =
        'La fecha de publicación es obligatoria.';

      return false;
    }

    const publicacion =
      new Date(this.fechaPublicacion);

    if (
      Number.isNaN(
        publicacion.getTime()
      )
    ) {
      this.errorMessage =
        'La fecha de publicación no es válida.';

      return false;
    }

    if (this.fechaExpiracion) {
      const expiracion =
        new Date(this.fechaExpiracion);

      if (
        Number.isNaN(
          expiracion.getTime()
        )
      ) {
        this.errorMessage =
          'La fecha de expiración no es válida.';

        return false;
      }

      if (
        expiracion <= publicacion
      ) {
        this.errorMessage =
          'La fecha de expiración debe ser posterior a la fecha de publicación.';

        return false;
      }
    }

    return true;
  }

  // =========================================================
  // CANCELAR
  // =========================================================

  cancelar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.cerrar.emit();
  }

  // =========================================================
  // CONTADORES
  // =========================================================

  get caracteresTitulo(): number {
    return this.titulo.length;
  }

  get caracteresMensaje(): number {
    return this.mensaje.length;
  }

  // =========================================================
  // FECHAS
  // =========================================================

  private obtenerFechaActualParaInput(): string {
    const fecha = new Date();

    fecha.setMinutes(
      fecha.getMinutes() -
      fecha.getTimezoneOffset()
    );

    return fecha
      .toISOString()
      .slice(0, 16);
  }

  private convertirFechaParaInput(
    fecha: string
  ): string {
    const valor = new Date(fecha);

    valor.setMinutes(
      valor.getMinutes() -
      valor.getTimezoneOffset()
    );

    return valor
      .toISOString()
      .slice(0, 16);
  }

  // =========================================================
  // MENSAJES
  // =========================================================

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}