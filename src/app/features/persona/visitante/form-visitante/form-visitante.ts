import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { EscanearInvitacionVisitante } from '../escanear-invitacion-visitante/escanear-invitacion-visitante';

import {
  RegistrarVisitanteRequest,
  VisitanteService,
} from '../../../../core/services/visitante/visitante';

type TipoPersona =
  | 'Residente'
  | 'Seguridad'
  | 'Mantenimiento'
  | '';

type VistaPersona =
  | 'inicio'
  | 'app-escanear-invitacion-visitante';

@Component({
  selector: 'app-form-visitante',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    EscanearInvitacionVisitante,
  ],
  templateUrl: './form-visitante.html',
  styleUrl: './form-visitante.css',
})
export class FormVisitanteComponent {
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() visitanteRegistrado = new EventEmitter<void>();

  nombre = '';
  documento = '';
  torre = '';
  apartamento = '';
  autorizadoPorNombre = '';

  foto: File | null = null;
  fotoPreview: string | null = null;

  isSaving = false;
  errorMessage = '';
  successMessage = '';

  tipo: TipoPersona = '';
  vistaActiva: VistaPersona = 'inicio';

  private readonly maxFotoBytes =
    5 * 1024 * 1024;

  private readonly tiposFotoPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  constructor(
    private readonly visitanteService: VisitanteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  cerrar(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isSaving) {
      return;
    }

    this.cerrarModal.emit();
  }

  escanearInvitacionVisitante(): void {
    this.cambiarVista(
      'app-escanear-invitacion-visitante'
    );
  }

  cambiarVista(vista: VistaPersona): void {
    this.vistaActiva = vista;
  }

  cerrarVistaActual(): void {
    this.abrirInicio();
  }

  abrirInicio(): void {
    this.cambiarVista('inicio');
  }

  onFotoSeleccionada(event: Event): void {
    this.errorMessage = '';

    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.[0];

    if (!archivo) {
      this.limpiarFoto();
      return;
    }

    if (
      !this.tiposFotoPermitidos.includes(
        archivo.type
      )
    ) {
      this.errorMessage =
        'Solo se permiten imágenes JPG, JPEG, PNG o WEBP.';

      input.value = '';
      this.limpiarFoto();
      return;
    }

    if (archivo.size > this.maxFotoBytes) {
      this.errorMessage =
        'La imagen no puede superar los 5 MB.';

      input.value = '';
      this.limpiarFoto();
      return;
    }

    this.foto = archivo;

    const reader = new FileReader();

    reader.onload = () => {
      this.fotoPreview =
        reader.result as string;

      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.errorMessage =
        'No fue posible cargar la vista previa de la imagen.';

      this.limpiarFoto();
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(archivo);
  }

  eliminarFoto(): void {
    this.limpiarFoto();
  }

  private limpiarFoto(): void {
    this.foto = null;
    this.fotoPreview = null;
  }

  guardar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const request: RegistrarVisitanteRequest = {
      nombre: this.nombre.trim(),
      documento: this.documento.trim(),
      torre: this.torre.trim(),
      apartamento: this.apartamento.trim(),
      autorizadoPorNombre:
        this.autorizadoPorNombre.trim(),
      foto: this.foto,
    };

    if (!request.nombre) {
      this.errorMessage =
        'El nombre del visitante es obligatorio.';
      return;
    }

    if (!request.documento) {
      this.errorMessage =
        'El documento del visitante es obligatorio.';
      return;
    }

    if (!request.torre) {
      this.errorMessage =
        'La torre es obligatoria.';
      return;
    }

    if (!request.apartamento) {
      this.errorMessage =
        'El apartamento es obligatorio.';
      return;
    }

    if (!request.autorizadoPorNombre) {
      this.errorMessage =
        'El nombre de quien autoriza es obligatorio.';
      return;
    }

    this.isSaving = true;

    this.visitanteService
      .crearVisitante(request)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response?.mensaje ||
            'Visitante registrado correctamente.';

          this.visitanteRegistrado.emit();

          setTimeout(() => {
            this.cerrarModal.emit();
          }, 600);
        },

        error: (err) => {
          this.errorMessage =
            err?.error?.mensaje ||
            'Ocurrió un error al registrar el visitante.';
        },
      });
  }
}