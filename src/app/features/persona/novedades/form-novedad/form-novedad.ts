import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { NovedadService } from '../../../../core/services/novedad/novedad';

@Component({
  selector: 'app-form-novedad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-novedad.html',
  styleUrl: './form-novedad.css',
})
export class FormNovedadComponent {
  @Output() onClose = new EventEmitter<void>();

  titulo = '';
  descripcion = '';
  tipo = 'Operativa';
  imagenBase64 = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly novedadService: NovedadService) {}

  cerrar(): void {
    if (this.isLoading) return;
    this.onClose.emit();
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

  guardar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.titulo.trim()) {
      this.errorMessage = 'Ingresa un título para la novedad.';
      return;
    }

    if (!this.descripcion.trim()) {
      this.errorMessage = 'Describe claramente la novedad.';
      return;
    }

    if (!this.tipo.trim()) {
      this.errorMessage = 'Selecciona el tipo de novedad.';
      return;
    }

    const request: {
      titulo: string;
      descripcion: string;
      tipo: string;
      imagenBase64?: string;
    } = {
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      tipo: this.tipo,
    };

    if (this.imagenBase64) {
      request.imagenBase64 = this.imagenBase64;
    }

    this.isLoading = true;

    this.novedadService
      .crearNovedad(request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Novedad creada correctamente.';

          setTimeout(() => {
            this.onClose.emit();
          }, 700);
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.mensaje ||
            err?.error?.message ||
            err?.error ||
            'No se pudo crear la novedad. Intenta nuevamente.';
        },
      });
  }
}