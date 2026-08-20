import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ClaseNovedad,
  NovedadService,
  PrioridadTarea,
} from '../../../../core/services/novedad/novedad';

@Component({
  selector: 'app-form-tarea',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-tarea.html',
  styleUrl: './form-tarea.css',
})
export class FormTarea {

  @Output() onClose = new EventEmitter<void>();
  @Output() tareaCreada = new EventEmitter<void>();

  titulo = '';
  descripcion = '';
  tipo = 'Operativa';

  prioridad: PrioridadTarea =
    PrioridadTarea.Media;

  fechaLimite = '';

  imagenBase64 = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  readonly prioridades = [
    {
      value: PrioridadTarea.Baja,
      label: 'Baja',
    },
    {
      value: PrioridadTarea.Media,
      label: 'Media',
    },
    {
      value: PrioridadTarea.Alta,
      label: 'Alta',
    },
    {
      value: PrioridadTarea.Critica,
      label: 'Crítica',
    },
  ];

  constructor(
    private readonly novedadService: NovedadService
  ) {}


  cerrar(): void {
    if (this.isLoading) {
      return;
    }

    this.onClose.emit();
  }


  onFileSelected(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const file = input.files?.[0];

    this.errorMessage = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage =
        'Solo se permiten archivos de imagen.';

      input.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage =
        'La imagen no puede superar los 2 MB.';

      input.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      this.imagenBase64 =
        reader.result as string;
    };

    reader.onerror = () => {
      this.errorMessage =
        'No se pudo cargar la imagen.';

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
      this.errorMessage =
        'Ingresa un título para la tarea.';
      return;
    }

    if (!this.descripcion.trim()) {
      this.errorMessage =
        'Describe claramente la tarea.';
      return;
    }

    if (!this.tipo.trim()) {
      this.errorMessage =
        'Selecciona el tipo de tarea.';
      return;
    }

    if (this.prioridad == null) {
      this.errorMessage =
        'Selecciona la prioridad de la tarea.';
      return;
    }

    if (
      this.fechaLimite &&
      this.fechaLimiteEsAnteriorAHoy()
    ) {
      this.errorMessage =
        'La fecha límite no puede ser anterior a la fecha actual.';
      return;
    }

    const request = {
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim(),
      tipo: this.tipo.trim(),

      clase: ClaseNovedad.Tarea,
      prioridad: this.prioridad,

      fechaLimite:
        this.fechaLimite || undefined,

      imagenBase64:
        this.imagenBase64 || undefined,
    };

    this.isLoading = true;

    this.novedadService
      .crearNovedad(request)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Tarea creada correctamente.';

          setTimeout(() => {
            this.tareaCreada.emit();
          }, 700);
        },

        error: (err) => {
          this.errorMessage =
            err?.error?.mensaje ??
            err?.error?.message ??
            err?.error ??
            'No se pudo crear la tarea. Intenta nuevamente.';
        },
      });
  }


  private fechaLimiteEsAnteriorAHoy(): boolean {
    if (!this.fechaLimite) {
      return false;
    }

    const fechaSeleccionada =
      new Date(`${this.fechaLimite}T00:00:00`);

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    return fechaSeleccionada < hoy;
  }
}