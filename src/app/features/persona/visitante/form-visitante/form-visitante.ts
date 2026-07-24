import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { EscanearInvitacionVisitante } from '../escanear-invitacion-visitante/escanear-invitacion-visitante';

import {
  RegistrarVisitanteRequest,
  VisitanteService,
} from '../../../../core/services/visitante/visitante';

type TipoPersona = 'Residente' | 'Seguridad' | 'Mantenimiento' | '';

type VistaPersona =
  | 'inicio'
  | 'app-escanear-invitacion-visitante'

@Component({
  selector: 'app-form-visitante',
  standalone: true,
  imports: [CommonModule, FormsModule, EscanearInvitacionVisitante],
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

  isSaving = false;
  errorMessage = '';
  successMessage = '';

  tipo: TipoPersona = '';
  vistaActiva: VistaPersona = 'inicio';

  constructor(
    private readonly visitanteService: VisitanteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  cerrar(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (this.isSaving) return;

    this.cerrarModal.emit();
  }

  escanearInvitacionVisitante(): void {
    this.cambiarVista('app-escanear-invitacion-visitante');
  }

  cambiarVista(vista: VistaPersona): void {
    this.vistaActiva = vista;
  }

  cerrarVistaActual(): void {
    this.abrirInicio();
  }

  abrirInicio(): void{
    this.cambiarVista('inicio')
  }

  guardar(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const request: RegistrarVisitanteRequest = {
      nombre: this.nombre.trim(),
      documento: this.documento.trim(),
      torre: this.torre.trim(),
      apartamento: this.apartamento.trim(),
      autorizadoPorNombre: this.autorizadoPorNombre.trim(),
    };

    if (!request.nombre) {
      this.errorMessage = 'El nombre del visitante es obligatorio.';
      return;
    }

    if (!request.documento) {
      this.errorMessage = 'El documento del visitante es obligatorio.';
      return;
    }

    if (!request.torre) {
      this.errorMessage = 'La torre es obligatoria.';
      return;
    }

    if (!request.apartamento) {
      this.errorMessage = 'El apartamento es obligatorio.';
      return;
    }

    if (!request.autorizadoPorNombre) {
      this.errorMessage = 'El nombre de quien autoriza es obligatorio.';
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
            response?.message || 'Visitante registrado correctamente.';

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