import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { NovedadService } from '../../../../core/services/novedad/novedad';

@Component({
  selector: 'app-form-seguimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-seguimiento.html',
  styleUrl: './form-seguimiento.css',
})
export class FormSeguimientoComponent {
  @Input() novedadId!: string;
  @Input() esFinalizacion = false;

  @Output() onClose = new EventEmitter<void>();

  comentario = '';
  imagenBase64 = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly novedadService: NovedadService) {}

  get tituloModal(): string {
    return this.esFinalizacion ? 'Cerrar novedad' : 'Agregar seguimiento';
  }

  get descripcionModal(): string {
    return this.esFinalizacion
      ? 'Registra el comentario final y la evidencia del cierre.'
      : 'Agrega una nueva actualización al historial de la novedad.';
  }

  get textoBoton(): string {
    if (this.isLoading) {
      return this.esFinalizacion ? 'Cerrando...' : 'Guardando...';
    }

    return this.esFinalizacion ? 'Cerrar novedad' : 'Agregar seguimiento';
  }

  cerrar(): void {
    if (this.isLoading) return;
    this.onClose.emit();
  }

  guardar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.novedadId) {
      this.errorMessage = 'No se encontró la novedad seleccionada.';
      return;
    }

    if (!this.comentario.trim()) {
      this.errorMessage = 'Debes escribir un comentario.';
      return;
    }

    const request: {
      novedadId: string;
      comentario: string;
      imagenBase64?: string;
    } = {
      novedadId: this.novedadId,
      comentario: this.comentario.trim(),
    };

    if (this.imagenBase64) {
      request.imagenBase64 = this.imagenBase64;
    }

    this.isLoading = true;

    const action$ = this.esFinalizacion
      ? this.novedadService.cerrarNovedad(request)
      : this.novedadService.agregarEvento(request);

    action$
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.successMessage = this.esFinalizacion
            ? 'Novedad cerrada correctamente.'
            : 'Seguimiento agregado correctamente.';

          setTimeout(() => {
            this.onClose.emit();
          }, 700);
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.mensaje ||
            err?.error?.message ||
            err?.error ||
            'No se pudo guardar la información. Intenta nuevamente.';
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.errorMessage = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Solo se permiten archivos de imagen.';
      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'La imagen no puede superar los 2 MB.';
      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.imagenBase64 = reader.result as string;
    };

    reader.onerror = () => {
      this.errorMessage = 'No se pudo cargar la imagen.';
      input.value = '';
    };

    reader.readAsDataURL(file);
  }

  quitarImagen(): void {
    this.imagenBase64 = '';
  }
}