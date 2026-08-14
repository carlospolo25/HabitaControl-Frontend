import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  Aviso,
  AvisoResponse,
  PrioridadAviso,
} from '../../../core/services/avisos/aviso';

import {
  CategoriaNormaConvivencia,
  NormaConvivencia,
  NormaConvivenciaResponse,
} from '../../../core/services/norma-convivencia/norma-convivencia';
import { API_CONFIG } from '../../../core/config/api.config';


type VistaConvivencia = 'avisos' | 'normas';


@Component({
  selector: 'app-avisos-convivencia-persona-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './avisos-convivencia-persona-component.html',
  styleUrl: './avisos-convivencia-persona-component.css',
})
export class AvisosConvivenciaPersonaComponent implements OnInit {

  // =========================================================
  // VISTA ACTIVA
  // =========================================================

  vistaActiva: VistaConvivencia = 'avisos';


  // =========================================================
  // AVISOS
  // =========================================================

  avisos: AvisoResponse[] = [];
  avisosFiltrados: AvisoResponse[] = [];

  avisoSeleccionado: AvisoResponse | null = null;

  searchAvisos = '';

  selectedPriority = 'todos';

  isLoadingAvisos = false;

  avisosError = '';


  // =========================================================
  // NORMAS
  // =========================================================

  normas: NormaConvivenciaResponse[] = [];
  normasFiltradas: NormaConvivenciaResponse[] = [];

  normaSeleccionada: NormaConvivenciaResponse | null = null;

  searchNormas = '';

  selectedCategory = 'todos';

  isLoadingNormas = false;

  normasError = '';


  // =========================================================
  // ENUMS
  // =========================================================

  readonly PrioridadAviso =
    PrioridadAviso;

  readonly CategoriaNormaConvivencia =
    CategoriaNormaConvivencia;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private readonly avisoService: Aviso,
    private readonly normaService: NormaConvivencia,
    private readonly cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.cargarAvisos();
    this.cargarNormas();
  }


  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  mostrarAvisos(): void {

    this.vistaActiva = 'avisos';

    this.cerrarDetalles();
  }


  mostrarNormas(): void {

    this.vistaActiva = 'normas';

    this.cerrarDetalles();
  }


  // =========================================================
  // CARGAR AVISOS
  // =========================================================

  cargarAvisos(): void {

    if (this.isLoadingAvisos) {
      return;
    }

    this.isLoadingAvisos = true;
    this.avisosError = '';

    this.avisoService
      .obtenerMisAvisos()
      .pipe(
        finalize(() => {
          this.isLoadingAvisos = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (avisos) => {

          this.avisos =
            [...avisos].sort(
              (a, b) =>
                this.compararAvisos(a, b)
            );

          this.filtrarAvisos();
        },

        error: (error) => {

          console.error(
            'Error cargando avisos para persona:',
            error
          );

          this.avisosError =
            error?.error?.message ??
            'No fue posible cargar los avisos.';
        },

      });
  }


  // =========================================================
  // CARGAR NORMAS
  // =========================================================

  cargarNormas(): void {

    if (this.isLoadingNormas) {
      return;
    }

    this.isLoadingNormas = true;
    this.normasError = '';

    this.normaService
      .obtenerMisNormas()
      .pipe(
        finalize(() => {

          this.isLoadingNormas = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({

        next: (normas) => {

          this.normas =
            [...normas].sort(
              (a, b) => {

                const ordenA =
                  a.orden ?? Number.MAX_SAFE_INTEGER;

                const ordenB =
                  b.orden ?? Number.MAX_SAFE_INTEGER;

                if (ordenA !== ordenB) {
                  return ordenA - ordenB;
                }

                return a.titulo.localeCompare(
                  b.titulo,
                  'es',
                  {
                    sensitivity: 'base',
                  }
                );
              }
            );

          this.filtrarNormas();
        },

        error: (error) => {

          console.error(
            'Error cargando normas de convivencia para persona:',
            error
          );

          this.normasError =
            error?.error?.message ??
            'No fue posible cargar las normas de convivencia.';
        },

      });
  }


  // =========================================================
  // FILTRAR AVISOS
  // =========================================================

  filtrarAvisos(): void {

    const termino =
      this.normalizarTexto(
        this.searchAvisos
      );

    this.avisosFiltrados =
      this.avisos.filter((aviso) => {

        const titulo =
          this.normalizarTexto(
            aviso.titulo
          );

        const mensaje =
          this.normalizarTexto(
            aviso.mensaje
          );

        const coincideBusqueda =
          !termino ||
          titulo.includes(termino) ||
          mensaje.includes(termino);

        const coincidePrioridad =
          this.selectedPriority === 'todos' ||
          aviso.prioridad ===
            Number(this.selectedPriority);

        return (
          coincideBusqueda &&
          coincidePrioridad
        );
      });
  }


  // =========================================================
  // FILTRAR NORMAS
  // =========================================================

  filtrarNormas(): void {

    const termino =
      this.normalizarTexto(
        this.searchNormas
      );

    this.normasFiltradas =
      this.normas.filter((norma) => {

        const titulo =
          this.normalizarTexto(
            norma.titulo
          );

        const contenido =
          this.normalizarTexto(
            norma.contenido
          );

        const coincideBusqueda =
          !termino ||
          titulo.includes(termino) ||
          contenido.includes(termino);

        const coincideCategoria =
          this.selectedCategory === 'todos' ||
          norma.categoria ===
            Number(this.selectedCategory);

        return (
          coincideBusqueda &&
          coincideCategoria
        );
      });
  }


  // =========================================================
  // LIMPIAR FILTROS
  // =========================================================

  limpiarFiltrosAvisos(): void {

    this.searchAvisos = '';
    this.selectedPriority = 'todos';

    this.filtrarAvisos();
  }


  limpiarFiltrosNormas(): void {

    this.searchNormas = '';
    this.selectedCategory = 'todos';

    this.filtrarNormas();
  }


  // =========================================================
  // DETALLE AVISO
  // =========================================================

  abrirAviso(
    aviso: AvisoResponse
  ): void {

    this.avisoSeleccionado = aviso;
  }


  cerrarAviso(): void {

    this.avisoSeleccionado = null;
  }


  // =========================================================
  // DETALLE NORMA
  // =========================================================

  abrirNorma(
    norma: NormaConvivenciaResponse
  ): void {

    this.normaSeleccionada = norma;
  }


  cerrarNorma(): void {

    this.normaSeleccionada = null;
  }


  private cerrarDetalles(): void {

    this.avisoSeleccionado = null;
    this.normaSeleccionada = null;
  }


  // =========================================================
  // ARCHIVOS
  // =========================================================

  abrirArchivo(
    archivoUrl?: string | null
  ): void {

    if (!archivoUrl) {
      return;
    }

    const backendUrl =
      API_CONFIG.baseUrl.replace(
        /\/api\/?$/,
        ''
      );

    const urlCompleta =
      archivoUrl.startsWith('http://') ||
      archivoUrl.startsWith('https://')
        ? archivoUrl
        : `${backendUrl}${archivoUrl}`;

    window.open(
      urlCompleta,
      '_blank',
      'noopener,noreferrer'
    );
  }


  // =========================================================
  // PRIORIDAD
  // =========================================================

  obtenerPrioridad(
    prioridad: PrioridadAviso
  ): string {

    return (
      PrioridadAviso[prioridad] ??
      'Sin prioridad'
    );
  }


  obtenerClasePrioridad(
    prioridad: PrioridadAviso
  ): string {

    const nombre =
      this.obtenerPrioridad(prioridad)
        .toLowerCase();

    if (
      nombre.includes('urgente') ||
      nombre.includes('alta')
    ) {
      return 'urgente';
    }

    if (
      nombre.includes('importante') ||
      nombre.includes('media')
    ) {
      return 'importante';
    }

    return 'informativo';
  }


  // =========================================================
  // CATEGORÍA
  // =========================================================

  obtenerCategoria(
    categoria: CategoriaNormaConvivencia
  ): string {

    return (
      CategoriaNormaConvivencia[categoria] ??
      'General'
    );
  }


  // =========================================================
  // TEXTO PREVIO
  // =========================================================

  obtenerResumen(
    texto: string | null | undefined,
    limite = 180
  ): string {

    const contenido =
      texto?.trim() ?? '';

    if (contenido.length <= limite) {
      return contenido;
    }

    return (
      contenido
        .substring(0, limite)
        .trimEnd() +
      '...'
    );
  }


  // =========================================================
  // ORDEN DE AVISOS
  // =========================================================

  private compararAvisos(
    a: AvisoResponse,
    b: AvisoResponse
  ): number {

    /*
     * Mayor valor de prioridad primero.
     *
     * Si nuestro enum utiliza el sentido contrario
     * podemos invertir esta comparación después.
     */
    if (a.prioridad !== b.prioridad) {

      return (
        Number(b.prioridad) -
        Number(a.prioridad)
      );
    }

    const fechaA =
      new Date(
        a.fechaPublicacion
      ).getTime();

    const fechaB =
      new Date(
        b.fechaPublicacion
      ).getTime();

    return fechaB - fechaA;
  }


  // =========================================================
  // NORMALIZAR TEXTO
  // =========================================================

  private normalizarTexto(
    valor: string | null | undefined
  ): string {

    return (valor ?? '')
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );
  }


  // =========================================================
  // TRACK BY
  // =========================================================

  trackByAviso(
    index: number,
    aviso: AvisoResponse
  ): string {

    return aviso.id;
  }


  trackByNorma(
    index: number,
    norma: NormaConvivenciaResponse
  ): string {

    return norma.id;
  }
}