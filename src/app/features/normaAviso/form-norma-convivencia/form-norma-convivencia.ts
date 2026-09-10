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
  CategoriaNormaConvivencia,
  NormaConvivencia,
  NormaConvivenciaResponse,
} from '../../../core/services/norma-convivencia/norma-convivencia';

@Component({
  selector: 'app-form-norma-convivencia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-norma-convivencia.html',
  styleUrl: './form-norma-convivencia.css',
})
export class FormNormaConvivencia implements OnChanges {

  // =========================================================
  // INPUTS / OUTPUTS
  // =========================================================

  @Input()
  norma: NormaConvivenciaResponse | null = null;

  @Output()
  cerrar = new EventEmitter<void>();

  @Output()
  guardado = new EventEmitter<void>();


  // =========================================================
  // FORMULARIO
  // =========================================================

  titulo = '';
  contenido = '';

  categoria: CategoriaNormaConvivencia =
    CategoriaNormaConvivencia.General;

  orden = 1;

  archivo: File | null = null;


  // =========================================================
  // ESTADOS
  // =========================================================

  isSubmitting = false;

  errorMessage = '';

  nombreArchivoSeleccionado = '';


  // =========================================================
  // ENUMS
  // =========================================================

  readonly CategoriaNormaConvivencia =
    CategoriaNormaConvivencia;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private readonly normaService: NormaConvivencia,
    private readonly cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // CAMBIOS DEL INPUT
  // =========================================================

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (changes['norma']) {
      this.cargarFormulario();
    }
  }


  // =========================================================
  // MODO
  // =========================================================

  get esEdicion(): boolean {
    return !!this.norma;
  }


  // =========================================================
  // CARGAR FORMULARIO
  // =========================================================

  private cargarFormulario(): void {

    this.errorMessage = '';
    this.archivo = null;
    this.nombreArchivoSeleccionado = '';

    if (!this.norma) {

      this.titulo = '';
      this.contenido = '';

      this.categoria =
        CategoriaNormaConvivencia.General;

      this.orden = 1;

      return;
    }

    this.titulo =
      this.norma.titulo ?? '';

    this.contenido =
      this.norma.contenido ?? '';

    this.categoria =
      this.norma.categoria;

    this.orden =
      this.norma.orden ?? 1;

    this.nombreArchivoSeleccionado =
      this.norma.nombreArchivo ?? '';
  }


  // =========================================================
  // SELECCIONAR ARCHIVO
  // =========================================================

  seleccionarArchivo(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    this.errorMessage = '';

    // 10 MB
    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {

      this.errorMessage =
        'El archivo no puede superar los 10 MB.';

      input.value = '';

      return;
    }

    const tiposPermitidos = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];

    if (
      !tiposPermitidos.includes(file.type)
    ) {

      this.errorMessage =
        'Solo se permiten archivos PDF, JPG o PNG.';

      input.value = '';

      return;
    }

    this.archivo = file;

    this.nombreArchivoSeleccionado =
      file.name;
  }


  // =========================================================
  // QUITAR ARCHIVO SELECCIONADO
  // =========================================================

  quitarArchivo(): void {

    this.archivo = null;

    this.nombreArchivoSeleccionado = '';

    this.errorMessage = '';
  }


  // =========================================================
  // GUARDAR
  // =========================================================

  guardar(): void {

    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';

    if (!this.validarFormulario()) {
      return;
    }

    if (this.esEdicion) {
      this.actualizar();
      return;
    }

    this.crear();
  }


  // =========================================================
  // CREAR
  // =========================================================

  private crear(): void {

    this.isSubmitting = true;

    const request = {
      titulo: this.titulo.trim(),
      contenido: this.contenido.trim(),
      categoria: this.categoria,
      orden: this.orden,
    };

    this.normaService
      .crear(
        request,
        this.archivo
      )
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.guardado.emit();
        },

        error: (error) => {
          console.error(
            'Error creando norma de convivencia:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible crear la norma de convivencia.';
        },
      });
  }


  // =========================================================
  // ACTUALIZAR
  // =========================================================

  private actualizar(): void {

    if (!this.norma) {
      return;
    }

    this.isSubmitting = true;

    const request = {
      titulo: this.titulo.trim(),
      contenido: this.contenido.trim(),
      categoria: this.categoria,
      orden: this.orden,
    };

    this.normaService
      .actualizar(
        this.norma.id,
        request,
        this.archivo
      )
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.guardado.emit();
        },

        error: (error) => {
          console.error(
            'Error actualizando norma de convivencia:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible actualizar la norma de convivencia.';
        },
      });
  }


  // =========================================================
  // VALIDACIONES
  // =========================================================

  private validarFormulario(): boolean {

    if (!this.titulo.trim()) {

      this.errorMessage =
        'El título de la norma es obligatorio.';

      return false;
    }

    if (this.titulo.trim().length > 150) {

      this.errorMessage =
        'El título no puede superar los 150 caracteres.';

      return false;
    }

    if (!this.contenido.trim()) {

      this.errorMessage =
        'El contenido de la norma es obligatorio.';

      return false;
    }

    if (this.contenido.trim().length > 5000) {

      this.errorMessage =
        'El contenido no puede superar los 5000 caracteres.';

      return false;
    }

    if (
      this.orden === null ||
      this.orden === undefined ||
      this.orden < 1
    ) {

      this.errorMessage =
        'El orden debe ser mayor o igual a 1.';

      return false;
    }

    return true;
  }

  // =========================================================
  // URL DEL ARCHIVO
  // =========================================================

  obtenerUrlArchivo(): string {

    if (
      !this.norma?.id ||
      !this.norma.archivoUrl?.trim()
    ) {
      return '';
    }

    return this.normaService.obtenerArchivoUrl(
      this.norma.id
    );
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
}