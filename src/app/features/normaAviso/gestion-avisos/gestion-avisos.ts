import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  AudienciaAviso,
  Aviso,
  AvisoResponse,
  PrioridadAviso,
} from '../../../core/services/avisos/aviso';
import { FormAvisoComponent } from '../FormAvisoComponent/form-aviso-component/form-aviso-component';
import { GestionNormasConvivenciaComponent } from '../gestion-normas-convivencia-component/gestion-normas-convivencia-component';

@Component({
  selector: 'app-gestion-avisos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormAvisoComponent,
    GestionNormasConvivenciaComponent
  ],
  templateUrl: './gestion-avisos.html',
  styleUrl: './gestion-avisos.css',
})
export class GestionAvisosComponent implements OnInit {

  avisos: AvisoResponse[] = [];
  avisosFiltrados: AvisoResponse[] = [];
  avisoSeleccionado: AvisoResponse | null = null;
  

  isLoading = false;
  isProcessing = false;
  errorMessage = '';
  successMessage = '';
  mostrarFormulario = false;
  searchTerm = '';
  selectedPriority = 'todos';
  selectedAudience = 'todos';
  selectedStatus = 'todos';
  vistaActiva: 'avisos' | 'normas' = 'avisos';


  readonly PrioridadAviso = PrioridadAviso;
  readonly AudienciaAviso = AudienciaAviso;

  constructor(
    private readonly avisoService: Aviso,
    private readonly cdr: ChangeDetectorRef
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.cargarAvisos();
  }

  // =========================================================
  // CARGAR
  // =========================================================

  cargarAvisos(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.avisoService
      .obtenerTodos()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (avisos) => {
          this.avisos = avisos;
          this.filtrarAvisos();
        },
        error: (error) => {
          console.error(
            'Error cargando avisos:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible cargar los avisos.';
        },
      });
  }

  // =========================================================
  // FILTROS
  // =========================================================

  filtrarAvisos(): void {
    const termino = this.searchTerm
      .trim()
      .toLowerCase();

    this.avisosFiltrados = this.avisos.filter((aviso) => {

      const coincideBusqueda =
        !termino ||
        aviso.titulo
          .toLowerCase()
          .includes(termino) ||
        aviso.mensaje
          .toLowerCase()
          .includes(termino);

      const coincidePrioridad =
        this.selectedPriority === 'todos' ||
        aviso.prioridad === Number(this.selectedPriority);

      const coincideAudiencia =
        this.selectedAudience === 'todos' ||
        aviso.audiencia === Number(this.selectedAudience);

      const coincideEstado =
        this.selectedStatus === 'todos' ||
        (
          this.selectedStatus === 'activo' &&
          aviso.activo
        ) ||
        (
          this.selectedStatus === 'inactivo' &&
          !aviso.activo
        );

      return (
        coincideBusqueda &&
        coincidePrioridad &&
        coincideAudiencia &&
        coincideEstado
      );
    });
  }

  mostrarAvisos(): void {
    this.vistaActiva = 'avisos';
  }

  mostrarNormas(): void {
    this.vistaActiva = 'normas';
  }

  // =========================================================
  // CREAR
  // =========================================================

  abrirCrear(): void {
    this.avisoSeleccionado = null;
    this.mostrarFormulario = true;

    this.limpiarMensajes();
  }

  // =========================================================
  // EDITAR
  // =========================================================

  abrirEditar(
    aviso: AvisoResponse
  ): void {
    this.avisoSeleccionado = aviso;
    this.mostrarFormulario = true;

    this.limpiarMensajes();
  }

  // =========================================================
  // CERRAR FORMULARIO
  // =========================================================

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.avisoSeleccionado = null;
  }

  // =========================================================
  // FORMULARIO COMPLETADO
  // =========================================================

  avisoGuardado(): void {
    this.cerrarFormulario();

    this.successMessage =
      'El aviso se guardó correctamente.';

    this.cargarAvisos();
  }

  // =========================================================
  // CAMBIAR ESTADO
  // =========================================================

  cambiarEstado(
    aviso: AvisoResponse
  ): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    const nuevoEstado = !aviso.activo;

    this.avisoService
      .cambiarEstado(
        aviso.id,
        {
          activo: nuevoEstado,
        }
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
              ? 'El aviso fue activado correctamente.'
              : 'El aviso fue desactivado correctamente.';

          this.cargarAvisos();
        },
        error: (error) => {
          console.error(
            'Error cambiando estado del aviso:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible cambiar el estado del aviso.';
        },
      });
  }

  // =========================================================
  // ELIMINAR
  // =========================================================

  eliminar(
    aviso: AvisoResponse
  ): void {
    if (aviso.activo) {
      this.errorMessage =
        'Debes desactivar el aviso antes de eliminarlo.';

      return;
    }

    const confirmar = window.confirm(
      `¿Deseas eliminar definitivamente el aviso "${aviso.titulo}"?`
    );

    if (!confirmar) {
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.avisoService
      .eliminar(aviso.id)
      .pipe(
        finalize(() => {
          this.isProcessing = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'El aviso fue eliminado correctamente.';

          this.cargarAvisos();
        },
        error: (error) => {
          console.error(
            'Error eliminando aviso:',
            error
          );

          this.errorMessage =
            error?.error?.message ??
            'No fue posible eliminar el aviso.';
        },
      });
  }

  // =========================================================
  // OBTENER ARCHIVO
  // =========================================================

  obtenerUrlArchivo(
    aviso: AvisoResponse
  ): string {
    if (
      !aviso?.id ||
      !aviso.archivoUrl?.trim()
    ) {
      return '';
    }

    return this.avisoService.obtenerArchivoUrl(
      aviso.id
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  obtenerPrioridad(
    prioridad: PrioridadAviso
  ): string {
    return PrioridadAviso[prioridad] ?? 'Sin prioridad';
  }

  obtenerAudiencia(
    audiencia: AudienciaAviso
  ): string {
    return AudienciaAviso[audiencia] ?? 'Sin audiencia';
  }

  trackByAviso(
    index: number,
    aviso: AvisoResponse
  ): string {
    return aviso.id;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedPriority = 'todos';
    this.selectedAudience = 'todos';
    this.selectedStatus = 'todos';

    this.filtrarAvisos();
  }

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}