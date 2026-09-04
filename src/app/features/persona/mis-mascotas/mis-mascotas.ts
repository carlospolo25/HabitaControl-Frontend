import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  AuthPersona,
} from '../../../core/services/authPersona/auth-persona';

import {
  ActualizarMascotaRequest,
  MascotaResponse,
  MascotaService,
  RegistrarMascotaRequest,
  TipoMascota,
} from '../../../core/services/mascotas/mascota-service';

import {
  obtenerFechaHoyColombia
} from '../../../core/utils/colombia-date.util';

interface OpcionTipoMascota {
  valor: TipoMascota;
  etiqueta: string;
  descripcion: string;
}

@Component({
  selector: 'app-mis-mascotas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './mis-mascotas.html',
  styleUrl: './mis-mascotas.css',
})
export class MisMascotasComponent
  implements OnInit, OnDestroy {

  private readonly apiBaseUrl =
    'https://localhost:7232';

  private readonly tiposImagenPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly tamanoMaximoFoto =
    5 * 1024 * 1024;

  personaId = '';

  mascotas: MascotaResponse[] = [];

  nombre = '';
  tipoSeleccionado: TipoMascota | null = null;
  raza = '';
  color = '';
  fechaNacimiento = '';
  observaciones = '';

  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;
  fotoActualUrl: string | null = null;

  mascotaEditandoId: string | null = null;

  isLoading = false;
  isSubmitting = false;
  mascotaDesactivandoId: string | null = null;

  errorMessage = '';
  successMessage = '';

  readonly TipoMascota = TipoMascota;

  readonly tiposMascota: OpcionTipoMascota[] = [
    {
      valor: TipoMascota.Perro,
      etiqueta: 'Perro',
      descripcion:
        'Caninos de cualquier tamaño, raza o condición.',
    },
    {
      valor: TipoMascota.Gato,
      etiqueta: 'Gato',
      descripcion:
        'Felinos domésticos asociados a la residencia.',
    },
    {
      valor: TipoMascota.Ave,
      etiqueta: 'Ave',
      descripcion:
        'Aves domésticas registradas por el residente.',
    },
    {
      valor: TipoMascota.Otro,
      etiqueta: 'Otro',
      descripcion:
        'Otra mascota permitida por la administración.',
    },
  ];

  constructor(
    private readonly mascotaService: MascotaService,
    private readonly authPersona: AuthPersona,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSesionPersona();
  }

  ngOnDestroy(): void {
    this.liberarFotoPreview();
  }

  cargarMascotas(): void {
    if (!this.personaId || this.isLoading) {
      return;
    }

    this.limpiarMensajes();
    this.isLoading = true;

    this.mascotaService
      .obtenerPorPersona(this.personaId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.mascotas = response ?? [];
        },
        error: error => {
          this.mascotas = [];
          this.errorMessage =
            this.obtenerMensajeError(error);
        },
      });
  }

  seleccionarFoto(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.item(0) ?? null;

    this.limpiarMensajes();

    if (!archivo) {
      return;
    }

    if (
      !this.tiposImagenPermitidos.includes(
        archivo.type
      )
    ) {
      input.value = '';

      this.errorMessage =
        'La fotografía debe estar en formato JPG, PNG o WebP.';

      return;
    }

    if (archivo.size > this.tamanoMaximoFoto) {
      input.value = '';

      this.errorMessage =
        'La fotografía no puede superar los 5 MB.';

      return;
    }

    this.liberarFotoPreview();

    this.fotoSeleccionada = archivo;
    this.fotoPreview =
      URL.createObjectURL(archivo);
  }

  quitarFotoSeleccionada(
    inputFoto?: HTMLInputElement
  ): void {
    if (this.isSubmitting) {
      return;
    }

    this.liberarFotoPreview();

    this.fotoSeleccionada = null;
    this.fotoPreview = null;

    if (inputFoto) {
      inputFoto.value = '';
    }
  }

  guardarMascota(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarMensajes();

    const validationMessage =
      this.validarFormulario();

    if (validationMessage) {
      this.errorMessage = validationMessage;
      return;
    }

    this.isSubmitting = true;

    if (this.mascotaEditandoId) {
      this.actualizarMascota();
      return;
    }

    this.registrarMascota();
  }

  editarMascota(
    mascota: MascotaResponse
  ): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarMensajes();
    this.liberarFotoPreview();

    this.mascotaEditandoId = mascota.id;

    this.nombre = mascota.nombre;
    this.tipoSeleccionado = mascota.tipo;
    this.raza = mascota.raza;
    this.color = mascota.color;

    this.fechaNacimiento =
      mascota.fechaNacimiento?.slice(0, 10) ?? '';

    this.observaciones =
      mascota.observaciones ?? '';

    this.fotoSeleccionada = null;
    this.fotoPreview = null;

    this.fotoActualUrl =
      this.construirFotoUrl(mascota.fotoUrl);
  }

  cancelarEdicion(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarFormulario();
    this.limpiarMensajes();
  }

  desactivarMascota(
    mascotaId: string
  ): void {
    if (
      !mascotaId ||
      this.mascotaDesactivandoId !== null
    ) {
      return;
    }

    const confirmar = window.confirm(
      '¿Deseas desactivar esta mascota? El registro se conservará como historial.'
    );

    if (!confirmar) {
      return;
    }

    this.limpiarMensajes();
    this.mascotaDesactivandoId = mascotaId;

    this.mascotaService
      .desactivar(mascotaId)
      .pipe(
        finalize(() => {
          this.mascotaDesactivandoId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.mascotas =
            this.mascotas.filter(
              mascota =>
                mascota.id !== mascotaId
            );

          if (
            this.mascotaEditandoId ===
            mascotaId
          ) {
            this.limpiarFormulario();
          }

          this.successMessage =
            'La mascota fue desactivada correctamente.';
        },
        error: error => {
          this.errorMessage =
            this.obtenerMensajeError(error);
        },
      });
  }

  obtenerNombreTipo(
    tipo: TipoMascota
  ): string {
    return (
      this.tiposMascota.find(
        opcion => opcion.valor === tipo
      )?.etiqueta ?? 'Tipo desconocido'
    );
  }

  obtenerDescripcionTipo(
    tipo: TipoMascota | null
  ): string {
    if (tipo === null) {
      return '';
    }

    return (
      this.tiposMascota.find(
        opcion => opcion.valor === tipo
      )?.descripcion ?? ''
    );
  }

  obtenerFotoMascota(
    mascota: MascotaResponse
  ): string | null {
    return this.construirFotoUrl(
      mascota.fotoUrl
    );
  }

  cerrarError(): void {
    this.errorMessage = '';
  }

  cerrarExito(): void {
    this.successMessage = '';
  }

  private cargarSesionPersona(): void {
    this.authPersona
      .comprobarSesion()
      .subscribe({
        next: (session) => {
          this.personaId =
            session.personaId;

          if (!this.personaId) {
            this.errorMessage =
              'No fue posible identificar a la persona autenticada.';

            return;
          }

          this.cargarMascotas();
        },

        error: () => {
          this.personaId = '';

          this.errorMessage =
            'No fue posible identificar a la persona autenticada.';
        },
      });
  }

  private registrarMascota(): void {
    const request: RegistrarMascotaRequest = {
      personaId: this.personaId,
      nombre: this.nombre.trim(),
      tipo: this.tipoSeleccionado!,
      raza: this.raza.trim(),
      color: this.color.trim(),

      fechaNacimiento:
        this.fechaNacimiento || null,

      observaciones:
        this.observaciones.trim() || null,
    };

    this.mascotaService
      .registrar(
        request,
        this.fotoSeleccionada
      )
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: mascota => {
          this.mascotas = [
            ...this.mascotas,
            mascota,
          ].sort((a, b) =>
            a.nombre.localeCompare(b.nombre)
          );

          this.limpiarFormulario();

          this.successMessage =
            'La mascota fue registrada correctamente.';
        },
        error: error => {
          this.errorMessage =
            this.obtenerMensajeError(error);
        },
      });
  }

  private actualizarMascota(): void {
    const mascotaId =
      this.mascotaEditandoId;

    if (!mascotaId) {
      this.isSubmitting = false;
      return;
    }

    const request: ActualizarMascotaRequest = {
      nombre: this.nombre.trim(),
      tipo: this.tipoSeleccionado!,
      raza: this.raza.trim(),
      color: this.color.trim(),

      fechaNacimiento:
        this.fechaNacimiento || null,

      observaciones:
        this.observaciones.trim() || null,
    };

    this.mascotaService
      .actualizar(
        mascotaId,
        request,
        this.fotoSeleccionada
      )
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: mascotaActualizada => {
          this.mascotas =
            this.mascotas
              .map(mascota =>
                mascota.id ===
                mascotaActualizada.id
                  ? mascotaActualizada
                  : mascota
              )
              .sort((a, b) =>
                a.nombre.localeCompare(
                  b.nombre
                )
              );

          this.limpiarFormulario();

          this.successMessage =
            'La mascota fue actualizada correctamente.';
        },
        error: error => {
          this.errorMessage =
            this.obtenerMensajeError(error);
        },
      });
  }

  private validarFormulario(): string {
    if (!this.personaId) {
      return 'No fue posible identificar a la persona autenticada.';
    }

    const nombreNormalizado =
      this.nombre.trim();

    const razaNormalizada =
      this.raza.trim();

    const colorNormalizado =
      this.color.trim();

    const observacionesNormalizadas =
      this.observaciones.trim();

    if (!nombreNormalizado) {
      return 'El nombre de la mascota es obligatorio.';
    }

    if (nombreNormalizado.length > 100) {
      return 'El nombre no puede superar los 100 caracteres.';
    }

    if (
      this.tipoSeleccionado == null ||
      ![
        TipoMascota.Perro,
        TipoMascota.Gato,
        TipoMascota.Ave,
        TipoMascota.Otro,
      ].includes(this.tipoSeleccionado)
    ) {
      return 'Selecciona un tipo de mascota válido.';
    }

    if (!razaNormalizada) {
      return 'La raza de la mascota es obligatoria.';
    }

    if (razaNormalizada.length > 100) {
      return 'La raza no puede superar los 100 caracteres.';
    }

    if (!colorNormalizado) {
      return 'El color de la mascota es obligatorio.';
    }

    if (colorNormalizado.length > 80) {
      return 'El color no puede superar los 80 caracteres.';
    }

    if (
      observacionesNormalizadas.length > 500
    ) {
      return 'Las observaciones no pueden superar los 500 caracteres.';
    }

    if (this.fechaNacimiento) {
      const hoyColombia =
        obtenerFechaHoyColombia();

      if (
        this.fechaNacimiento > hoyColombia
      ) {
        return 'La fecha de nacimiento no puede ser futura.';
      }
    }

    if (
      this.fotoSeleccionada &&
      !this.tiposImagenPermitidos.includes(
        this.fotoSeleccionada.type
      )
    ) {
      return 'La fotografía debe estar en formato JPG, PNG o WebP.';
    }

    if (
      this.fotoSeleccionada &&
      this.fotoSeleccionada.size >
        this.tamanoMaximoFoto
    ) {
      return 'La fotografía no puede superar los 5 MB.';
    }

    return '';
  }

  private limpiarFormulario(): void {
    this.liberarFotoPreview();

    this.mascotaEditandoId = null;

    this.nombre = '';
    this.tipoSeleccionado = null;
    this.raza = '';
    this.color = '';
    this.fechaNacimiento = '';
    this.observaciones = '';

    this.fotoSeleccionada = null;
    this.fotoPreview = null;
    this.fotoActualUrl = null;
  }

  private liberarFotoPreview(): void {
    if (
      this.fotoPreview?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        this.fotoPreview
      );
    }
  }

  private construirFotoUrl(
    fotoUrl: string | null
  ): string | null {
    if (!fotoUrl) {
      return null;
    }

    if (
      fotoUrl.startsWith('http://') ||
      fotoUrl.startsWith('https://') ||
      fotoUrl.startsWith('data:') ||
      fotoUrl.startsWith('blob:')
    ) {
      return fotoUrl;
    }

    const rutaNormalizada =
      fotoUrl.startsWith('/')
        ? fotoUrl
        : `/${fotoUrl}`;

    return `${this.apiBaseUrl}${rutaNormalizada}`;
  }

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private obtenerMensajeError(
    error: any
  ): string {
    const backendMessage =
      error?.error?.message ??
      error?.error?.mensaje ??
      error?.error?.title;

    if (
      typeof backendMessage === 'string' &&
      backendMessage.trim()
    ) {
      return backendMessage;
    }

    const validationErrors =
      error?.error?.errors;

    if (
      validationErrors &&
      typeof validationErrors === 'object'
    ) {
      const firstValidationError =
        Object.values(validationErrors)
          .flat()
          .find(
            message =>
              typeof message ===
                'string' &&
              message.trim().length > 0
          );

      if (
        typeof firstValidationError ===
        'string'
      ) {
        return firstValidationError;
      }
    }

    switch (error?.status) {
      case 0:
        return 'No fue posible conectarse con el servidor. Verifica que la API esté disponible.';

      case 400:
        return 'La información enviada no es válida. Revisa los datos de la mascota y la fotografía.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para gestionar mascotas.';

      case 404:
        return 'La mascota o la persona asociada no fueron encontradas.';

      case 409:
        return 'Ya existe una mascota activa con el mismo nombre y tipo.';

      case 413:
        return 'La fotografía enviada supera el tamaño permitido.';

      case 415:
        return 'El formato de la fotografía no es compatible.';

      case 500:
        return 'Ocurrió un error interno al procesar la mascota.';

      default:
        return 'No fue posible completar la operación con la mascota.';
    }
  }
}