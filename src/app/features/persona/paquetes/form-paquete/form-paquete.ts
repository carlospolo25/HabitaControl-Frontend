import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  RegistrarPaqueteRequest,
  PaqueteService,
} from '../../../../core/services/paquete/paquete';

import {
  PersonService,
  ResidenteBusquedaResponse,
} from '../../../../core/services/person/person-service';

@Component({
  selector: 'app-form-paquete',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-paquete.html',
  styleUrl: './form-paquete.css',
})
export class FormPaqueteComponent {
  @Output() cerrar = new EventEmitter<void>();
  @Output() paqueteRegistrado = new EventEmitter<void>();

  nombreDestinatario = '';
  personaDestinatariaId = '';

  apartamento = '';
  torre = '';
  descripcion = '';

  residentesEncontrados: ResidenteBusquedaResponse[] = [];
  residenteSeleccionado = false;
  buscandoResidentes = false;

  foto: File | null = null;
  fotoPreview: string | null = null;

  isSubmitting = false;
  errorMessage = '';

  private readonly maxFotoBytes =
    5 * 1024 * 1024;

  private readonly tiposFotoPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  constructor(
    private readonly paqueteService: PaqueteService,
    private readonly personService: PersonService,
    private readonly cdr: ChangeDetectorRef
  ) {}

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

  onNombreDestinatarioChange(
    valor: string
  ): void {
    this.nombreDestinatario = valor;

    this.personaDestinatariaId = '';
    this.residenteSeleccionado = false;

    this.torre = '';
    this.apartamento = '';

    this.residentesEncontrados = [];
    this.errorMessage = '';

    if (this.busquedaTimeout) {
      clearTimeout(this.busquedaTimeout);
    }

    const termino = valor.trim();

    if (termino.length < 2) {
      this.buscandoResidentes = false;
      return;
    }

    this.busquedaTimeout = setTimeout(() => {
      this.buscarResidentes(termino);
    }, 300);
  }

  private buscarResidentes(
    termino: string
  ): void {
    this.buscandoResidentes = true;

    this.personService
      .buscarResidentesParaPaquetes(
        termino
      )
      .pipe(
        finalize(() => {
          this.buscandoResidentes = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (residentes) => {
          if (
            this.nombreDestinatario
              .trim()
              .toLowerCase() !==
            termino.toLowerCase()
          ) {
            return;
          }

          this.residentesEncontrados =
            residentes;

          this.cdr.detectChanges();
        },

        error: (error: HttpErrorResponse) => {
          this.residentesEncontrados = [];

          this.errorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible buscar los residentes.'
            );
        },
      });
  }

  seleccionarResidente(
    residente: ResidenteBusquedaResponse
  ): void {
    this.personaDestinatariaId =
      residente.id;

    this.nombreDestinatario =
      residente.nombre;

    this.torre =
      residente.torre;

    this.apartamento =
      residente.apartamento;

    this.residenteSeleccionado = true;

    this.residentesEncontrados = [];

    this.errorMessage = '';

    if (this.busquedaTimeout) {
      clearTimeout(this.busquedaTimeout);
      this.busquedaTimeout = null;
    }
  }

  private busquedaTimeout:
  ReturnType<typeof setTimeout> | null = null;

  private limpiarFoto(): void {
    this.foto = null;
    this.fotoPreview = null;
  }

  guardar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';

    const nombreDestinatario =
      this.nombreDestinatario.trim();

    const apartamento =
      this.apartamento.trim();

    const torre =
      this.torre.trim();

    const descripcion =
      this.descripcion.trim();

    if (!nombreDestinatario) {
      this.errorMessage =
        'Ingresa el nombre del destinatario.';
      return;
    }

    if (
      !this.personaDestinatariaId ||
      !this.residenteSeleccionado
    ) {
      this.errorMessage =
        'Debes seleccionar un residente registrado de la lista.';
      return;
    }

    if (nombreDestinatario.length > 150) {
      this.errorMessage =
        'El nombre del destinatario no puede superar los 150 caracteres.';
      return;
    }

    if (!torre) {
      this.errorMessage =
        'La torre es obligatoria.';
      return;
    }

    if (torre.length > 20) {
      this.errorMessage =
        'La torre no puede superar los 20 caracteres.';
      return;
    }

    if (!apartamento) {
      this.errorMessage =
        'El apartamento es obligatorio.';
      return;
    }

    if (apartamento.length > 20) {
      this.errorMessage =
        'El apartamento no puede superar los 20 caracteres.';
      return;
    }

    if (!descripcion) {
      this.errorMessage =
        'La descripción del paquete es obligatoria.';
      return;
    }

    if (
      descripcion.length < 3 ||
      descripcion.length > 300
    ) {
      this.errorMessage =
        'La descripción debe tener entre 3 y 300 caracteres.';
      return;
    }

    const request: RegistrarPaqueteRequest = {
      personaDestinatariaId:
        this.personaDestinatariaId,

      nombreDestinatario,
      torre,
      apartamento,
      descripcion,
      foto: this.foto,
    };

    this.isSubmitting = true;

    this.paqueteService
      .registrar(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.paqueteRegistrado.emit();
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            this.obtenerMensajeError(
              error,
              'No fue posible registrar el paquete.'
            );
        },
      });
  }

  cerrarFormulario(): void {
    if (this.isSubmitting) {
      return;
    }

    this.cerrar.emit();
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.cerrarFormulario();
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    if (error.status === 0) {
      return 'No fue posible conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    }

    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (
      typeof error.error?.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message;
    }

    if (
      typeof error.error?.mensaje === 'string' &&
      error.error.mensaje.trim()
    ) {
      return error.error.mensaje;
    }

    if (
      typeof error.error?.detail === 'string' &&
      error.error.detail.trim()
    ) {
      return error.error.detail;
    }

    if (error.error?.errors) {
      const mensajes = Object.values(
        error.error.errors
      )
        .flat()
        .filter(
          (mensaje): mensaje is string =>
            typeof mensaje === 'string'
        );

      if (mensajes.length > 0) {
        return mensajes.join(' ');
      }
    }

    switch (error.status) {
      case 400:
        return 'La información ingresada no es válida. Revisa los campos del formulario.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para registrar paquetes.';

      case 404:
        return 'No se encontró el residente o apartamento indicado.';

      case 409:
        return 'No fue posible registrar el paquete debido a un conflicto con la información ingresada.';

      default:
        return mensajePredeterminado;
    }
  }
}