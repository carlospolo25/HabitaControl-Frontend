import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  CrearInvitacionVisitanteRequest,
  VisitanteService,
} from '../../../../core/services/visitante/visitante';

@Component({
  selector: 'app-crear-invitacion-visitante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crear-invitacion-visitante.html',
  styleUrl: './crear-invitacion-visitante.css',
})
export class CrearInvitacionVisitante {
  @Output() cerrar = new EventEmitter<void>();

  form: CrearInvitacionVisitanteRequest = {
    nombre: '',
    documento: '',
    torre: '',
    apartamento: '',
    emailVisitante: '',
    telefonoVisitante: '',
  };

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  tokenGenerado = '';
  qrBase64 = '';

  constructor(
    private readonly visitanteService: VisitanteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  crearInvitacion(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.tokenGenerado = '';
    this.qrBase64 = '';

    if (!this.form.nombre.trim()) {
      this.errorMessage = 'El nombre del visitante es obligatorio.';
      return;
    }

    if (!this.form.documento.trim()) {
      this.errorMessage = 'El documento del visitante es obligatorio.';
      return;
    }

    if (!this.form.emailVisitante.trim()) {
      this.errorMessage = 'El correo del visitante es obligatorio.';
      return;
    }

    if (!this.form.torre.trim()) {
      this.errorMessage = 'La torre es obligatoria.';
      return;
    }

    if (!this.form.apartamento.trim()) {
      this.errorMessage = 'El apartamento es obligatorio.';
      return;
    }

    this.isLoading = true;

    const request: CrearInvitacionVisitanteRequest = {
      nombre: this.form.nombre.trim(),
      documento: this.form.documento.trim(),
      torre: this.form.torre.trim(),
      apartamento: this.form.apartamento.trim(),
      emailVisitante: this.form.emailVisitante.trim(),
      telefonoVisitante:
        this.form.telefonoVisitante?.trim() || undefined,
    };

    this.visitanteService
      .crearInvitacion(request)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.tokenGenerado = response.token;
          this.qrBase64 = response.qrBase64;

          this.successMessage =
            'Invitación creada correctamente y enviada al correo del visitante.';

          this.limpiarFormulario();

          setTimeout(() => {
            this.cerrar.emit();
          }, 1500);
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.mensaje ||
            err?.error ||
            'No se pudo crear la invitación del visitante.';
        },
      });
  }

  limpiarFormulario(): void {
    this.form = {
      nombre: '',
      documento: '',
      torre: '',
      apartamento: '',
      emailVisitante: '',
      telefonoVisitante: '',
    };
  }

  cerrarFormulario(): void {
    this.cerrar.emit();
  }
}