import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ClaseNovedad,
  CrearNovedadRequest,
  NovedadService,
} from '../../../../core/services/novedad/novedad';

@Component({
  selector: 'app-form-novedad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-novedad.html',
  styleUrl: './form-novedad.css',
})
export class FormNovedadComponent implements OnInit {

  @Output() onClose = new EventEmitter<void>();

  titulo = '';
  descripcion = '';
  tipo = 'Operativa';
  imagenBase64 = '';

  isResident = false;

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly novedadService: NovedadService
  ) {}


  ngOnInit(): void {
    this.loadUserPermissions();
  }


  cerrar(): void {
    if (this.isLoading) return;

    this.onClose.emit();
  }


  onFileSelected(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    this.errorMessage = '';

    if (!file) return;

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
        'Ingresa un título para la novedad.';
      return;
    }

    if (!this.descripcion.trim()) {
      this.errorMessage =
        'Describe claramente la novedad.';
      return;
    }

    if (!this.tipo.trim()) {
      this.errorMessage =
        'Selecciona el tipo de novedad.';
      return;
    }

    // =====================================================
    // RESTRICCIÓN PARA RESIDENTES
    // =====================================================

    if (
      this.isResident &&
      this.tipo === 'Operativa'
    ) {
      this.errorMessage =
        'Los residentes no pueden reportar novedades operativas.';

      this.tipo = 'Gestion';

      return;
    }


    const request: CrearNovedadRequest = {
      titulo:
        this.titulo.trim(),

      descripcion:
        this.descripcion.trim(),

      tipo:
        this.tipo.trim(),

      // Este formulario crea exclusivamente novedades.
      clase:
        ClaseNovedad.Novedad,

      // Estos campos solamente aplican a Tareas.
      prioridad:
        null,

      fechaLimite:
        null,
    };


    if (this.imagenBase64) {
      request.imagenBase64 =
        this.imagenBase64;
    }


    this.isLoading = true;


    this.novedadService
      .crearNovedad(request)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response?.mensaje ||
            'Novedad creada correctamente.';

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


  // =====================================================
  // PERMISOS
  // =====================================================

  private loadUserPermissions(): void {
    const token =
      localStorage.getItem(
        'personaAccessToken'
      );

    if (!token) {
      this.isResident = false;
      return;
    }

    try {
      const payload =
        this.decodeJwt(token);

      const tipoPersona =
        this.getClaim(
          payload,
          [
            'TipoPersona',
            'tipoPersona',
            'Tipo',
            'tipo',
            'personType',
            'PersonType',
          ]
        );

      this.isResident =
        tipoPersona === 'Residente';

      // Seguridad adicional:
      // un residente siempre comienza
      // con Operativa.
      if (this.isResident) {
        this.tipo = 'Gestion';
      }

    } catch {
      this.isResident = false;
    }
  }


  private decodeJwt(
    token: string
  ): any {
    const payload =
      token.split('.')[1];

    if (!payload) {
      throw new Error(
        'Token inválido.'
      );
    }

    const normalizedPayload =
      payload
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    return JSON.parse(
      atob(normalizedPayload)
    );
  }


  private getClaim(
    payload: any,
    keys: string[]
  ): string {
    for (const key of keys) {
      if (payload[key]) {
        return payload[key];
      }
    }

    return '';
  }
}