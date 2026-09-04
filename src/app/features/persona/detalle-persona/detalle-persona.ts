import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { finalize } from 'rxjs';

import {
  PersonResponse,
} from '../../../core/services/person/person-service';

import {
  TipoVehiculo,
  VehiculoResponse,
  VehiculoService,
} from '../../../core/services/vehiculos/vehiculo-service';

import {
  MascotaResponse,
  MascotaService,
  TipoMascota,
} from '../../../core/services/mascotas/mascota-service';

type DetallePersonaTab =
  | 'datos'
  | 'vehiculos'
  | 'mascotas';

@Component({
  selector: 'app-detalle-persona',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-persona.html',
  styleUrl: './detalle-persona.css',
})
export class DetallePersona implements OnChanges {
  private readonly apiBaseUrl =
    'https://localhost:7232';

  @Input({ required: true })
  persona!: PersonResponse;

  @Output()
  cerrar = new EventEmitter<void>();

  tab: DetallePersonaTab = 'datos';

  vehiculos: VehiculoResponse[] = [];
  mascotas: MascotaResponse[] = [];

  isLoadingVehiculos = false;
  isLoadingMascotas = false;

  errorVehiculos = '';
  errorMascotas = '';

  imagenAmpliada: string | null = null;
  imagenAmpliadaAlt = '';

  vehiculosCargados = false;
  mascotasCargadas = false;

  readonly TipoVehiculo = TipoVehiculo;
  readonly TipoMascota = TipoMascota;

  constructor(
    private readonly vehiculoService: VehiculoService,
    private readonly mascotaService: MascotaService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (
      changes['persona'] &&
      changes['persona'].currentValue
    ) {
      this.reiniciarDetalle();
    }
  }

  obtenerFotoPersona(): string | null {
    return this.construirUrlArchivo(
      this.persona?.fotoUrl
    );
  }


  abrirImagen(
    url: string | null,
    alt: string
  ): void {
    if (!url) {
      return;
    }

    this.imagenAmpliada = url;
    this.imagenAmpliadaAlt = alt;
  }

  cerrarImagen(): void {
    this.imagenAmpliada = null;
    this.imagenAmpliadaAlt = '';
  }

  cambiarTab(
    tab: DetallePersonaTab
  ): void {
    this.tab = tab;

    if (
      tab === 'vehiculos' &&
      !this.vehiculosCargados
    ) {
      this.cargarVehiculos();
    }

    if (
      tab === 'mascotas' &&
      !this.mascotasCargadas
    ) {
      this.cargarMascotas();
    }
  }

  cerrarDetalle(): void {
    this.reiniciarDetalle();
    this.cerrar.emit();
  }

  cargarVehiculos(
    forzarRecarga = false
  ): void {
    if (
      !this.persona?.id ||
      this.isLoadingVehiculos
    ) {
      return;
    }

    if (
      this.vehiculosCargados &&
      !forzarRecarga
    ) {
      return;
    }

    this.errorVehiculos = '';
    this.isLoadingVehiculos = true;

    this.vehiculoService
      .obtenerPorPersona(this.persona.id)
      .pipe(
        finalize(() => {
          this.isLoadingVehiculos = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.vehiculos = (
            response ?? []
          ).sort((a, b) =>
            a.placa.localeCompare(
              b.placa,
              'es',
              {
                sensitivity: 'base',
              }
            )
          );

          this.vehiculosCargados = true;
        },
        error: error => {
          this.vehiculos = [];
          this.vehiculosCargados = false;

          this.errorVehiculos =
            this.obtenerMensajeError(
              error,
              'vehículos'
            );
        },
      });
  }

  cargarMascotas(
    forzarRecarga = false
  ): void {
    if (
      !this.persona?.id ||
      this.isLoadingMascotas
    ) {
      return;
    }

    if (
      this.mascotasCargadas &&
      !forzarRecarga
    ) {
      return;
    }

    this.errorMascotas = '';
    this.isLoadingMascotas = true;

    this.mascotaService
      .obtenerPorPersona(this.persona.id)
      .pipe(
        finalize(() => {
          this.isLoadingMascotas = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.mascotas = (
            response ?? []
          ).sort((a, b) =>
            a.nombre.localeCompare(
              b.nombre,
              'es',
              {
                sensitivity: 'base',
              }
            )
          );

          this.mascotasCargadas = true;
        },
        error: error => {
          this.mascotas = [];
          this.mascotasCargadas = false;

          this.errorMascotas =
            this.obtenerMensajeError(
              error,
              'mascotas'
            );
        },
      });
  }

  recargarVehiculos(): void {
    this.vehiculosCargados = false;
    this.cargarVehiculos(true);
  }

  recargarMascotas(): void {
    this.mascotasCargadas = false;
    this.cargarMascotas(true);
  }

  obtenerNombreTipoVehiculo(
    tipo: TipoVehiculo
  ): string {
    switch (tipo) {
      case TipoVehiculo.Carro:
        return 'Carro';

      case TipoVehiculo.Moto:
        return 'Moto';

      case TipoVehiculo.NoMotorizado:
        return 'No motorizado';

      default:
        return 'Tipo desconocido';
    }
  }

  obtenerNombreTipoMascota(
    tipo: TipoMascota
  ): string {
    switch (tipo) {
      case TipoMascota.Perro:
        return 'Perro';

      case TipoMascota.Gato:
        return 'Gato';

      case TipoMascota.Ave:
        return 'Ave';

      case TipoMascota.Otro:
        return 'Otro';

      default:
        return 'Tipo desconocido';
    }
  }

  obtenerFotoVehiculo(
    vehiculo: VehiculoResponse
  ): string | null {
    return this.construirUrlArchivo(
      vehiculo.fotoUrl
    );
  }

  obtenerFotoMascota(
    mascota: MascotaResponse
  ): string | null {
    return this.construirUrlArchivo(
      mascota.fotoUrl
    );
  }

  cerrarErrorVehiculos(): void {
    this.errorVehiculos = '';
  }

  cerrarErrorMascotas(): void {
    this.errorMascotas = '';
  }

  private reiniciarDetalle(): void {
    this.tab = 'datos';

    this.vehiculos = [];
    this.mascotas = [];

    this.isLoadingVehiculos = false;
    this.isLoadingMascotas = false;

    this.errorVehiculos = '';
    this.errorMascotas = '';

    this.vehiculosCargados = false;
    this.mascotasCargadas = false;

    this.imagenAmpliada = null;
    this.imagenAmpliadaAlt = '';
  }

  private construirUrlArchivo(
    ruta: string | null | undefined
  ): string | null {
    if (!ruta) {
      return null;
    }

    if (
      ruta.startsWith('http://') ||
      ruta.startsWith('https://') ||
      ruta.startsWith('data:') ||
      ruta.startsWith('blob:')
    ) {
      return ruta;
    }

    const rutaNormalizada =
      ruta.startsWith('/')
        ? ruta
        : `/${ruta}`;

    return `${this.apiBaseUrl}${rutaNormalizada}`;
  }

  private obtenerMensajeError(
    error: any,
    recurso: string
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
        return `No fue posible consultar los ${recurso} porque la solicitud no es válida.`;

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return `No tienes permisos para consultar los ${recurso} de esta persona.`;

      case 404:
        return `No se encontró la persona o sus ${recurso} asociados.`;

      case 500:
        return `Ocurrió un error interno al consultar los ${recurso}.`;

      default:
        return `No fue posible cargar los ${recurso}.`;
    }
  }
}