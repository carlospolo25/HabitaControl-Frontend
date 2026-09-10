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
  ActualizarVehiculoRequest,
  RegistrarVehiculoRequest,
  TipoVehiculo,
  VehiculoResponse,
  VehiculoService,
} from '../../../core/services/vehiculos/vehiculo-service';

import {
  AuthPersona,
} from '../../../core/services/authPersona/auth-persona';

interface OpcionTipoVehiculo {
  valor: TipoVehiculo;
  etiqueta: string;
  descripcion: string;
}

@Component({
  selector: 'app-mis-vehiculos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './mis-vehiculos.html',
  styleUrl: './mis-vehiculos.css',
})
export class MisVehiculosComponent implements OnInit, OnDestroy {



  private readonly tiposImagenPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly tamanoMaximoFoto =
    5 * 1024 * 1024;

  personaId = '';

  vehiculos: VehiculoResponse[] = [];

  tipoSeleccionado: TipoVehiculo | null = null;
  placa = '';
  marca = '';
  color = '';

  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;
  fotoActualUrl: string | null = null;

  vehiculoEditandoId: string | null = null;

  isLoading = false;
  isSubmitting = false;
  vehiculoDesactivandoId: string | null = null;

  errorMessage = '';
  successMessage = '';

  readonly TipoVehiculo = TipoVehiculo;

  readonly tiposVehiculo: OpcionTipoVehiculo[] = [
    {
      valor: TipoVehiculo.Carro,
      etiqueta: 'Carro',
      descripcion:
        'Automóviles, camionetas, camperos y vehículos similares.',
    },
    {
      valor: TipoVehiculo.Moto,
      etiqueta: 'Moto',
      descripcion:
        'Motocicletas, motonetas y vehículos motorizados similares.',
    },
    {
      valor: TipoVehiculo.NoMotorizado,
      etiqueta: 'No motorizado',
      descripcion:
        'Bicicletas y otros medios de transporte sin motor.',
    },
  ];

  constructor(
    private readonly vehiculoService: VehiculoService,
    private readonly authPersona: AuthPersona,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSesionPersona();
  }

  ngOnDestroy(): void {
    this.liberarFotoPreview();
  }

  cargarVehiculos(): void {
    if (!this.personaId || this.isLoading) {
      return;
    }

    this.limpiarMensajes();
    this.isLoading = true;

    this.vehiculoService
      .obtenerPorPersona(this.personaId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.vehiculos = response ?? [];
        },
        error: error => {
          this.vehiculos = [];
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

  guardarVehiculo(): void {
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

    if (this.vehiculoEditandoId) {
      this.actualizarVehiculo();
      return;
    }

    this.registrarVehiculo();
  }

  editarVehiculo(
    vehiculo: VehiculoResponse
  ): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarMensajes();
    this.liberarFotoPreview();

    this.vehiculoEditandoId = vehiculo.id;
    this.tipoSeleccionado = vehiculo.tipo;
    this.placa = vehiculo.placa;
    this.marca = vehiculo.marca;
    this.color = vehiculo.color;

    this.fotoSeleccionada = null;
    this.fotoPreview = null;

    this.fotoActualUrl =
      vehiculo.fotoUrl
        ? this.vehiculoService.obtenerFotoUrl(
            vehiculo.id
          )
        : null;
  }

  cancelarEdicion(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarFormulario();
    this.limpiarMensajes();
  }

  desactivarVehiculo(
    vehiculoId: string
  ): void {
    if (
      !vehiculoId ||
      this.vehiculoDesactivandoId !== null
    ) {
      return;
    }

    const confirmar = window.confirm(
      '¿Deseas desactivar este vehículo? El registro se conservará como historial.'
    );

    if (!confirmar) {
      return;
    }

    this.limpiarMensajes();
    this.vehiculoDesactivandoId =
      vehiculoId;

    this.vehiculoService
      .desactivar(vehiculoId)
      .pipe(
        finalize(() => {
          this.vehiculoDesactivandoId =
            null;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.vehiculos =
            this.vehiculos.filter(
              vehiculo =>
                vehiculo.id !== vehiculoId
            );

          if (
            this.vehiculoEditandoId ===
            vehiculoId
          ) {
            this.limpiarFormulario();
          }

          this.successMessage =
            'El vehículo fue desactivado correctamente.';
        },
        error: error => {
          this.errorMessage =
            this.obtenerMensajeError(error);
        },
      });
  }

  obtenerNombreTipo(
    tipo: TipoVehiculo
  ): string {
    return (
      this.tiposVehiculo.find(
        opcion => opcion.valor === tipo
      )?.etiqueta ?? 'Tipo desconocido'
    );
  }

  obtenerDescripcionTipo(
    tipo: TipoVehiculo | null
  ): string {
    if (tipo === null) {
      return '';
    }

    return (
      this.tiposVehiculo.find(
        opcion => opcion.valor === tipo
      )?.descripcion ?? ''
    );
  }

  obtenerFotoVehiculo(
    vehiculo: VehiculoResponse
  ): string | null {
    if (!vehiculo.fotoUrl) {
      return null;
    }

    return this.vehiculoService.obtenerFotoUrl(
      vehiculo.id
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

          this.cargarVehiculos();
        },

        error: () => {
          this.personaId = '';

          this.errorMessage =
            'No fue posible identificar a la persona autenticada.';
        },
      });
  }

  private registrarVehiculo(): void {
    const request: RegistrarVehiculoRequest = {
      personaId: this.personaId,
      tipo: this.tipoSeleccionado!,
      placa: this.placa
        .trim()
        .toUpperCase(),
      marca: this.marca.trim(),
      color: this.color.trim(),
    };

    this.vehiculoService
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
        next: vehiculo => {
          this.vehiculos = [
            ...this.vehiculos,
            vehiculo,
          ].sort((a, b) =>
            a.placa.localeCompare(b.placa)
          );

          this.limpiarFormulario();

          this.successMessage =
            'El vehículo fue registrado correctamente.';
        },
        error: error => {
          this.errorMessage =
            this.obtenerMensajeError(error);
        },
      });
  }

  private actualizarVehiculo(): void {
    const vehiculoId =
      this.vehiculoEditandoId;

    if (!vehiculoId) {
      this.isSubmitting = false;
      return;
    }

    const request: ActualizarVehiculoRequest = {
      tipo: this.tipoSeleccionado!,
      placa: this.placa
        .trim()
        .toUpperCase(),
      marca: this.marca.trim(),
      color: this.color.trim(),
    };

    this.vehiculoService
      .actualizar(
        vehiculoId,
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
        next: vehiculoActualizado => {
          this.vehiculos =
            this.vehiculos
              .map(vehiculo =>
                vehiculo.id ===
                vehiculoActualizado.id
                  ? vehiculoActualizado
                  : vehiculo
              )
              .sort((a, b) =>
                a.placa.localeCompare(
                  b.placa
                )
              );

          this.limpiarFormulario();

          this.successMessage =
            'El vehículo fue actualizado correctamente.';
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

    if (
      this.tipoSeleccionado == null ||
      ![
        TipoVehiculo.Carro,
        TipoVehiculo.Moto,
        TipoVehiculo.NoMotorizado,
      ].includes(this.tipoSeleccionado)
    ) {
      return 'Selecciona un tipo de vehículo válido.';
    }

    const placaNormalizada =
      this.placa.trim();

    const marcaNormalizada =
      this.marca.trim();

    const colorNormalizado =
      this.color.trim();

    if (!placaNormalizada) {
      return 'La placa del vehículo es obligatoria.';
    }

    if (placaNormalizada.length > 20) {
      return 'La placa no puede superar los 20 caracteres.';
    }

    if (!marcaNormalizada) {
      return 'La marca del vehículo es obligatoria.';
    }

    if (marcaNormalizada.length > 80) {
      return 'La marca no puede superar los 80 caracteres.';
    }

    if (!colorNormalizado) {
      return 'El color del vehículo es obligatorio.';
    }

    if (colorNormalizado.length > 50) {
      return 'El color no puede superar los 50 caracteres.';
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

    this.vehiculoEditandoId = null;
    this.tipoSeleccionado = null;

    this.placa = '';
    this.marca = '';
    this.color = '';

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
        return 'La información enviada no es válida. Revisa los datos del vehículo y la fotografía.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para gestionar vehículos.';

      case 404:
        return 'El vehículo o la persona asociada no fueron encontrados.';

      case 409:
        return 'Ya existe un vehículo activo con esta placa.';

      case 413:
        return 'La fotografía enviada supera el tamaño permitido.';

      case 415:
        return 'El formato de la fotografía no es compatible.';

      case 500:
        return 'Ocurrió un error interno al procesar el vehículo.';

      default:
        return 'No fue posible completar la operación con el vehículo.';
    }
  }
}