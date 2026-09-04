import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  CategoriaNormaConvivencia,
  CambiarEstadoNormaConvivenciaRequest,
  NormaConvivencia,
  NormaConvivenciaResponse,
} from '../../../core/services/norma-convivencia/norma-convivencia';
import { FormNormaConvivencia } from '../form-norma-convivencia/form-norma-convivencia';

import { API_CONFIG } from '../../../core/config/api.config';


@Component({
  selector: 'app-gestion-normas-convivencia',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormNormaConvivencia,
  ],
  templateUrl: './gestion-normas-convivencia-component.html',
  styleUrl: './gestion-normas-convivencia-component.css',
})
export class GestionNormasConvivenciaComponent implements OnInit {

  // =========================================================
  // DATOS
  // =========================================================

  normas: NormaConvivenciaResponse[] = [];
  normasFiltradas: NormaConvivenciaResponse[] = [];

  normaSeleccionada: NormaConvivenciaResponse | null = null;

  // =========================================================
  // ESTADOS
  // =========================================================

  isLoading = false;
  isProcessing = false;

  mostrarFormulario = false;

  errorMessage = '';
  successMessage = '';

  // =========================================================
  // FILTROS
  // =========================================================

  searchTerm = '';

  selectedCategory = 'all';
  selectedStatus = 'all';

  // =========================================================
  // ENUM
  // =========================================================

  readonly CategoriaNormaConvivencia =
    CategoriaNormaConvivencia;

  constructor(
    private readonly normaService: NormaConvivencia,
    private readonly cdr: ChangeDetectorRef
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.cargarNormas();
  }

  // =========================================================
  // CARGAR
  // =========================================================

  cargarNormas(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.normaService
      .obtenerTodas()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.normas = response ?? [];

          this.filtrarNormas();
        },

        error: (error) => {
          console.error(
            'Error cargando normas de convivencia:',
            error
          );

          this.normas = [];
          this.normasFiltradas = [];

          this.errorMessage =
            error?.error?.message ??
            'No fue posible cargar las normas de convivencia.';
        },
      });
  }

  obtenerUrlArchivo(
    archivoUrl?: string | null
  ): string {

    if (!archivoUrl) {
      return '';
    }

    if (
      archivoUrl.startsWith('http://') ||
      archivoUrl.startsWith('https://')
    ) {
      return archivoUrl;
    }

    const backendUrl =
      API_CONFIG.baseUrl.replace(
        /\/api\/?$/,
        ''
      );

    const rutaArchivo =
      archivoUrl.startsWith('/')
        ? archivoUrl
        : `/${archivoUrl}`;

    return `${backendUrl}${rutaArchivo}`;
  }

  // =========================================================
  // FILTRAR
  // =========================================================

  filtrarNormas(): void {
    const termino =
      this.normalizarTexto(this.searchTerm);

    this.normasFiltradas =
      this.normas.filter((norma) => {

        // ---------------------------------------------------
        // BÚSQUEDA
        // ---------------------------------------------------

        const coincideBusqueda =
          !termino ||
          this.normalizarTexto(
            norma.titulo
          ).includes(termino) ||
          this.normalizarTexto(
            norma.contenido
          ).includes(termino) ||
          this.normalizarTexto(
            norma.nombreArchivo ?? ''
          ).includes(termino);

        // ---------------------------------------------------
        // CATEGORÍA
        // ---------------------------------------------------

        const coincideCategoria =
          this.selectedCategory === 'all' ||
          String(norma.categoria) ===
            this.selectedCategory;

        // ---------------------------------------------------
        // ESTADO
        // ---------------------------------------------------

        const coincideEstado =
          this.selectedStatus === 'all' ||
          (
            this.selectedStatus === 'active' &&
            norma.activo
          ) ||
          (
            this.selectedStatus === 'inactive' &&
            !norma.activo
          );

        return (
          coincideBusqueda &&
          coincideCategoria &&
          coincideEstado
        );
      });

    // -------------------------------------------------------
    // ORDEN
    // -------------------------------------------------------

    this.normasFiltradas.sort(
      (a, b) => a.orden - b.orden
    );
  }

  // =========================================================
  // LIMPIAR FILTROS
  // =========================================================

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedStatus = 'all';

    this.filtrarNormas();
  }

  // =========================================================
  // CREAR
  // =========================================================

  abrirCrear(): void {
    this.normaSeleccionada = null;
    this.mostrarFormulario = true;

    this.limpiarMensajes();
  }

  // =========================================================
  // EDITAR
  // =========================================================

  abrirEditar(
    norma: NormaConvivenciaResponse
  ): void {
    this.normaSeleccionada = norma;
    this.mostrarFormulario = true;

    this.limpiarMensajes();
  }

  // =========================================================
  // CERRAR FORMULARIO
  // =========================================================

  cerrarFormulario(): void {
    if (this.isProcessing) {
      return;
    }

    this.mostrarFormulario = false;
    this.normaSeleccionada = null;
  }

  // =========================================================
  // NORMA GUARDADA
  // =========================================================

  normaGuardada(): void {
    this.cerrarFormulario();

    this.successMessage =
      'La norma de convivencia se guardó correctamente.';

    this.cargarNormas();
  }

  // =========================================================
  // CAMBIAR ESTADO
  // =========================================================

  cambiarEstado(
    norma: NormaConvivenciaResponse
  ): void {
    if (this.isProcessing) {
      return;
    }

    const nuevoEstado = !norma.activo;

    const request:
      CambiarEstadoNormaConvivenciaRequest = {
        activo: nuevoEstado,
      };

    this.isProcessing = true;

    this.limpiarMensajes();

    this.normaService
      .cambiarEstado(
        norma.id,
        request
      )
      .pipe(
        finalize(() => {
          this.isProcessing = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage =
            nuevoEstado
              ? 'La norma fue activada correctamente.'
              : 'La norma fue desactivada correctamente.';

          this.cargarNormas();
        },

        error: (error) => {
          console.error(
            'Error cambiando estado de la norma:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible cambiar el estado de la norma.';
        },
      });
  }

  // =========================================================
  // ELIMINAR
  // =========================================================

  eliminar(
    norma: NormaConvivenciaResponse
  ): void {
    if (this.isProcessing) {
      return;
    }

    const confirmado = window.confirm(
      `¿Seguro que deseas eliminar la norma "${norma.titulo}"?`
    );

    if (!confirmado) {
      return;
    }

    this.isProcessing = true;

    this.limpiarMensajes();

    this.normaService
      .eliminar(norma.id)
      .pipe(
        finalize(() => {
          this.isProcessing = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'La norma de convivencia fue eliminada correctamente.';

          this.cargarNormas();
        },

        error: (error) => {
          console.error(
            'Error eliminando norma de convivencia:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible eliminar la norma de convivencia.';
        },
      });
  }

  // =========================================================
  // CATEGORÍA
  // =========================================================

  obtenerNombreCategoria(
    categoria: CategoriaNormaConvivencia
  ): string {
    switch (categoria) {

      case CategoriaNormaConvivencia.General:
        return 'General';

      case CategoriaNormaConvivencia.Ruido:
        return 'Ruido';

      case CategoriaNormaConvivencia.Mascotas:
        return 'Mascotas';

      case CategoriaNormaConvivencia.Parqueaderos:
        return 'Parqueaderos';

      case CategoriaNormaConvivencia.ZonasComunes:
        return 'Zonas comunes';

      case CategoriaNormaConvivencia.Seguridad:
        return 'Seguridad';

      default:
        return 'Otra';
    }
  }

  // =========================================================
  // CONTADORES
  // =========================================================

  get totalNormas(): number {
    return this.normas.length;
  }

  get totalActivas(): number {
    return this.normas.filter(
      (norma) => norma.activo
    ).length;
  }

  get totalInactivas(): number {
    return this.normas.filter(
      (norma) => !norma.activo
    ).length;
  }

  // =========================================================
  // TRACK BY
  // =========================================================

  trackByNorma(
    index: number,
    norma: NormaConvivenciaResponse
  ): string {
    return norma.id;
  }

  // =========================================================
  // NORMALIZACIÓN
  // =========================================================

  private normalizarTexto(
    valor: string
  ): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  // =========================================================
  // MENSAJES
  // =========================================================

  limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}