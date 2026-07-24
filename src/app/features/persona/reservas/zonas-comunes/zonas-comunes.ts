import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit,} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  ZonaComunResponse,
  ZonaComunService,
} from '../../../../core/services/ZonaComun/zona-comun';
import { FormZonaComunes } from '../form-zona-comunes/form-zona-comunes';

type VistaZonas = 'todas' | 'activas';

@Component({
  selector: 'app-zonas-comunes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormZonaComunes
  ],
  templateUrl: './zonas-comunes.html',
  styleUrl: './zonas-comunes.css',
})
export class ZonasComunesComponent implements OnInit {

  zonas: ZonaComunResponse[] = [];

  zonaFormulario: ZonaComunResponse | null = null;
  zonaSeleccionada: ZonaComunResponse | null = null;

  vistaActual: VistaZonas = 'todas';

  isLoading = false;
  isLoadingDetail = false;

  zonaProcesandoId: string | null = null;

  errorMessage = '';
  detailErrorMessage = '';
  successMessage = '';

  mostrarFormulario = false;
  
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  constructor(
    private readonly zonaComunService: ZonaComunService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarTodas();
  }

  cargarTodas(): void {
    if (this.isLoading) {
      return;
    }

    this.vistaActual = 'todas';
    this.cargarZonas();
  }

  cargarActivas(): void {
    if (this.isLoading) {
      return;
    }

    this.vistaActual = 'activas';
    this.cargarZonas();
  }

  recargar(): void {
    this.cargarZonas();
  }

  get totalActiveZones(): number {
    return this.zonas.filter((zone) => zone.activa).length;
  }

  get totalInactiveZones(): number {
    return this.zonas.filter((zone) => !zone.activa).length;
  }

  abrirFormularioCrear(): void {
    if (
      this.isLoading ||
      this.isLoadingDetail ||
      this.zonaProcesandoId !== null
    ) {
      return;
    }

    this.limpiarMensajes();

    this.zonaFormulario = null;
    this.mostrarFormulario = true;

    this.cdr.detectChanges();
  }

  abrirFormularioEditar(
    zona: ZonaComunResponse,
  ): void {
    if (
      this.isLoading ||
      this.isLoadingDetail ||
      this.zonaProcesandoId !== null
    ) {
      return;
    }

    this.limpiarMensajes();

    this.zonaFormulario = zona;
    this.mostrarFormulario = true;

    this.cdr.detectChanges();
  }
    cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.zonaFormulario = null;

    this.cdr.detectChanges();
  }

  zonaGuardada(zonaGuardada: ZonaComunResponse): void {
    const yaExiste = this.zonas.some(
      (zona) => zona.id === zonaGuardada.id,
    );

    if (yaExiste) {
      this.actualizarZonaEnListado(zonaGuardada);

      this.successMessage =
        'La zona común fue actualizada correctamente.';
    } else {
      this.zonas = [
        zonaGuardada,
        ...this.zonas,
      ];

      this.successMessage =
        'La zona común fue creada correctamente.';
    }

    if (
      this.zonaSeleccionada?.id ===
      zonaGuardada.id
    ) {
      this.zonaSeleccionada = zonaGuardada;
    }

    this.cerrarFormulario();
    this.cdr.detectChanges();
  }

  verDetalle(zonaComunId: string): void {
    if (!zonaComunId || this.isLoadingDetail) {
      return;
    }

    this.isLoadingDetail = true;
    this.detailErrorMessage = '';
    this.successMessage = '';

    this.zonaComunService
      .obtenerPorId(zonaComunId)
      .pipe(
        finalize(() => {
          this.isLoadingDetail = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.zonaSeleccionada = response;
        },
        error: (error) => {
          this.zonaSeleccionada = null;

          this.detailErrorMessage = this.obtenerMensajeError(
            error,
            'No fue posible consultar la zona común.',
          );
        },
      });
  }

  cerrarDetalle(): void {
    if (this.isLoadingDetail) {
      return;
    }

    this.zonaSeleccionada = null;
    this.detailErrorMessage = '';
  }

  editarDesdeDetalle(): void {
    if (
      !this.zonaSeleccionada ||
      this.isLoadingDetail ||
      this.zonaProcesandoId !== null
    ) {
      return;
    }

    const zona = this.zonaSeleccionada;

    this.cerrarDetalle();
    this.abrirFormularioEditar(zona);
  }


  cambiarEstado(zona: ZonaComunResponse): void {
    if (
      this.isLoading ||
      this.isLoadingDetail ||
      this.mostrarFormulario ||
      this.zonaProcesandoId !== null
    ) {
      return;
    }

    const nuevoEstado = !zona.activa;

    this.limpiarMensajes();
    this.zonaProcesandoId = zona.id;

    this.zonaComunService
      .cambiarEstado(zona.id, nuevoEstado)
      .pipe(
        finalize(() => {
          this.zonaProcesandoId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.actualizarZonaEnListado(response);

          if (this.zonaSeleccionada?.id === response.id) {
            this.zonaSeleccionada = response;
          }

          if (
            this.vistaActual === 'activas' &&
            !response.activa
          ) {
            this.zonas = this.zonas.filter(
              (item) => item.id !== response.id,
            );
          }

          this.successMessage = response.activa
            ? 'La zona común fue activada correctamente.'
            : 'La zona común fue desactivada correctamente.';
        },
        error: (error) => {
          this.errorMessage = this.obtenerMensajeError(
            error,
            nuevoEstado
              ? 'No fue posible activar la zona común.'
              : 'No fue posible desactivar la zona común.',
          );
        },
      });
  }

  estaProcesando(zonaComunId: string): boolean {
    return this.zonaProcesandoId === zonaComunId;
  }

  trackByZonaComun(
    _index: number,
    zona: ZonaComunResponse,
  ): string {
    return zona.id;
  }

  private cargarZonas(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request$ =
      this.vistaActual === 'activas'
        ? this.zonaComunService.obtenerActivas()
        : this.zonaComunService.obtener();

    request$
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response) => {
          this.zonas = response ?? [];
        },
        error: (error) => {
          this.zonas = [];

          this.errorMessage = this.obtenerMensajeError(
            error,
            this.vistaActual === 'activas'
              ? 'No fue posible cargar las zonas comunes activas.'
              : 'No fue posible cargar las zonas comunes.',
          );
        },
      });
  }


  private actualizarZonaEnListado(
    zonaActualizada: ZonaComunResponse,
  ): void {
    this.zonas = this.zonas.map((zona) =>
      zona.id === zonaActualizada.id
        ? zonaActualizada
        : zona,
    );
  }

  private normalizarTextoOpcional(
    value: string | null,
  ): string | null {
    const normalizedValue = value?.trim() ?? '';

    return normalizedValue || null;
  }

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.detailErrorMessage = '';
    this.successMessage = '';
  }

  private obtenerMensajeError(
    error: any,
    fallbackMessage: string,
  ): string {
    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.error?.mensaje) {
      return error.error.mensaje;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.error?.title) {
      return error.error.title;
    }

    if (error?.error?.errors) {
      const validationMessages = Object.values(
        error.error.errors,
      )
        .flat()
        .filter(
          (message): message is string =>
            typeof message === 'string',
        );

      if (validationMessages.length > 0) {
        return validationMessages.join(' ');
      }
    }

    return fallbackMessage;
  }

  get filteredZones(): ZonaComunResponse[] {
    const normalizedSearch = this.searchTerm
      .trim()
      .toLowerCase();

    return this.zonas.filter((zone) => {
      const matchesSearch =
        !normalizedSearch ||
        zone.nombre.toLowerCase().includes(normalizedSearch) ||
        (zone.descripcion ?? '')
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && zone.activa) ||
        (this.statusFilter === 'inactive' && !zone.activa);

      return matchesSearch && matchesStatus;
    });
  }

  setStatusFilter(
    filter: 'all' | 'active' | 'inactive',
  ): void {
    this.statusFilter = filter;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
  }
}