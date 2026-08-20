import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { NovedadAsignar } from '../novedad-asignar/novedad-asignar';
import { NovedadEventosDetalle } from '../novedad-eventos-detalle/novedad-eventos-detalle';
import { FormTarea } from '../form-tarea/form-tarea';

import {
  ClaseNovedad,
  NovedadResponse,
  NovedadService,
  PrioridadTarea,
} from '../../../../core/services/novedad/novedad';

@Component({
  selector: 'app-lista-novedades',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NovedadAsignar,
    NovedadEventosDetalle,
    FormTarea,
  ],
  templateUrl: './lista-novedades.html',
  styleUrl: './lista-novedades.css',
})
export class ListaNovedadesComponent implements OnInit {
  @Input() esAdmin = false;

  @Output() iniciarSeguimiento = new EventEmitter<string>();
  @Output() finalizarSeguimiento = new EventEmitter<string>();
  @Output() verHistorial = new EventEmitter<string>();

  novedades: NovedadResponse[] = [];
  filteredNovedades: NovedadResponse[] = [];

  searchTerm = '';

  selectedClass = 'all';
  selectedStatus = 'all';
  selectedAssignment = 'all';
  selectedPriority = 'all';
  selectedDeadline = 'all';
  selectedSort = 'recent';

  isLoading = false;
  errorMessage = '';

  role = '';
  personType = '';

  isAdmin = false;
  isSecurity = false;
  isMaintenance = false;

  asignacionNovedad = false;
  mostrarDetalles = false;
  novedadSeleccionadaId = '';

  mostrarFormTarea = false;


  private accionEnProceso = false;

  constructor(
    private readonly novedadService: NovedadService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserPermissions();
    this.cargar();
  }

  abrirFormTarea(): void {
    if (!this.isAdmin || this.isBusy()) {
      return;
    }

    this.mostrarFormTarea = true;
  }

  cerrarFormTarea(recargar = false): void {
    this.mostrarFormTarea = false;

    if (recargar) {
      this.cargar();
    }
  }

  cargar(): void {
    if (this.isLoading) return;

    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    const request$ = this.shouldLoadAssignedNews()
      ? this.novedadService.obtenerMisAsignadas()
      : this.novedadService.obtener();

    request$
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.novedades = Array.isArray(response)
            ? response
            : [];

          this.applyFilters();
        },

        error: (err) => {
          this.novedades = [];
          this.filteredNovedades = [];

          this.errorMessage =
            err?.error?.message ??
            err?.error?.mensaje ??
            err?.message ??
            'No fue posible cargar las novedades y tareas.';
        },
      });
  }

  abrirAsignacion(id: string): void {
    if (!this.canAssignNews() || this.isBusy()) return;

    this.novedadSeleccionadaId = id;
    this.asignacionNovedad = true;
  }

  cerrarAsignacion(recargar = true): void {
    this.asignacionNovedad = false;
    this.novedadSeleccionadaId = '';

    if (recargar) {
      this.cargar();
    }
  }

  mostrarHistorial(id: string): void {
    if (!this.canViewHistory() || this.isBusy()) return;

    this.novedadSeleccionadaId = id;
    this.mostrarDetalles = true;
  }

  cerrarDetalles(): void {
    this.mostrarDetalles = false;
    this.novedadSeleccionadaId = '';
  }

  abrirSeguimiento(id: string): void {
    if (!this.canStartTracking() || this.isBusy()) return;

    this.ejecutarAccion(() =>
      this.iniciarSeguimiento.emit(id)
    );
  }

  abrirFinalizacion(id: string): void {
    if (!this.canFinishTracking() || this.isBusy()) return;

    this.ejecutarAccion(() =>
      this.finalizarSeguimiento.emit(id)
    );
  }

  shouldLoadAssignedNews(): boolean {
    return (
      !this.isAdmin &&
      (this.isSecurity || this.isMaintenance)
    );
  }

  canAssignNews(): boolean {
    return this.isAdmin;
  }

  canStartTracking(): boolean {
    return this.isSecurity || this.isMaintenance;
  }

  canFinishTracking(): boolean {
    return this.isSecurity || this.isMaintenance;
  }

  canViewHistory(): boolean {
    return (
      this.isAdmin ||
      this.isSecurity ||
      this.isMaintenance
    );
  }

  applyFilters(): void {
    let data = [...this.novedades];

    const term = this.searchTerm
      .trim()
      .toLowerCase();

    if (term) {
      data = data.filter((n) =>
        (n.titulo ?? '')
          .toLowerCase()
          .includes(term) ||

        (n.descripcion ?? '')
          .toLowerCase()
          .includes(term) ||

        (n.reportadaPor ?? '')
          .toLowerCase()
          .includes(term) ||

        (n.asignadaA ?? '')
          .toLowerCase()
          .includes(term)
      );
    }

    // =====================================================
    // CLASE: NOVEDAD / TAREA
    // =====================================================

    if (this.selectedClass !== 'all') {
      const clase =
        this.selectedClass === 'novedad'
          ? ClaseNovedad.Novedad
          : ClaseNovedad.Tarea;

      data = data.filter(
        (n) => n.clase === clase
      );
    }

    // =====================================================
    // ESTADO
    // =====================================================

    if (this.selectedStatus !== 'all') {
      data = data.filter(
        (n) => n.estado === this.selectedStatus
      );
    }

    // =====================================================
    // ASIGNACIÓN
    // =====================================================

    if (this.selectedAssignment === 'assigned') {
      data = data.filter(
        (n) => !!n.asignadaAId
      );
    }

    if (this.selectedAssignment === 'unassigned') {
      data = data.filter(
        (n) => !n.asignadaAId
      );
    }

    // =====================================================
    // PRIORIDAD
    // Solo aplica a tareas.
    // =====================================================

    if (this.selectedPriority !== 'all') {
      const prioridad = this.getPriorityValue(
        this.selectedPriority
      );

      data = data.filter(
        (n) =>
          n.clase === ClaseNovedad.Tarea &&
          n.prioridad === prioridad
      );
    }

    // =====================================================
    // FECHA LÍMITE
    // Solo aplica a tareas.
    // =====================================================

    if (this.selectedDeadline === 'overdue') {
      data = data.filter(
        (n) => this.isOverdue(n)
      );
    }

    if (this.selectedDeadline === 'pending') {
      data = data.filter(
        (n) =>
          n.clase === ClaseNovedad.Tarea &&
          !!n.fechaLimite &&
          !this.isOverdue(n) &&
          n.estado !== 'Finalizada'
      );
    }

    if (this.selectedDeadline === 'no-deadline') {
      data = data.filter(
        (n) =>
          n.clase === ClaseNovedad.Tarea &&
          !n.fechaLimite
      );
    }

    // =====================================================
    // ORDEN
    // =====================================================

    switch (this.selectedSort) {
      case 'oldest':
        data.sort(
          (a, b) =>
            new Date(a.fechaCreacion).getTime() -
            new Date(b.fechaCreacion).getTime()
        );
        break;

        case 'events':
          data.sort(
            (a, b) =>
              b.totalEventos -
              a.totalEventos
          );
          break;

      case 'deadline':
        data.sort((a, b) => {
          const fechaA = a.fechaLimite
            ? new Date(a.fechaLimite).getTime()
            : Number.MAX_SAFE_INTEGER;

          const fechaB = b.fechaLimite
            ? new Date(b.fechaLimite).getTime()
            : Number.MAX_SAFE_INTEGER;

          return fechaA - fechaB;
        });
        break;

      default:
        data.sort(
          (a, b) =>
            new Date(
              b.ultimaActualizacion ??
                b.fechaCreacion
            ).getTime() -
            new Date(
              a.ultimaActualizacion ??
                a.fechaCreacion
            ).getTime()
        );
        break;
    }

    this.filteredNovedades = data;
  }

  isTask(novedad: NovedadResponse): boolean {
    return novedad.clase === ClaseNovedad.Tarea;
  }

  isNews(novedad: NovedadResponse): boolean {
    return novedad.clase === ClaseNovedad.Novedad;
  }

  isOverdue(novedad: NovedadResponse): boolean {
    if (
      novedad.clase !== ClaseNovedad.Tarea ||
      !novedad.fechaLimite ||
      novedad.estado === 'Finalizada'
    ) {
      return false;
    }

    const fechaLimite = new Date(
      novedad.fechaLimite
    );

    const hoy = new Date();

    fechaLimite.setHours(23, 59, 59, 999);

    return fechaLimite.getTime() < hoy.getTime();
  }

  getClassLabel(
    clase: ClaseNovedad
  ): string {
    return clase === ClaseNovedad.Tarea
      ? 'Tarea'
      : 'Novedad';
  }

  getPriorityLabel(
    prioridad?: PrioridadTarea | null
  ): string {
    switch (prioridad) {
      case PrioridadTarea.Baja:
        return 'Baja';

      case PrioridadTarea.Media:
        return 'Media';

      case PrioridadTarea.Alta:
        return 'Alta';

      case PrioridadTarea.Critica:
        return 'Crítica';

      default:
        return '—';
    }
  }

  private getPriorityValue(
    value: string
  ): PrioridadTarea | null {
    switch (value) {
      case 'low':
        return PrioridadTarea.Baja;

      case 'medium':
        return PrioridadTarea.Media;

      case 'high':
        return PrioridadTarea.Alta;

      case 'critical':
        return PrioridadTarea.Critica;

      default:
        return null;
    }
  }

  private loadUserPermissions(): void {
    const token = this.getCurrentToken();

    if (!token) {
      this.resetPermissions();
      return;
    }

    try {
      const payload = this.decodeJwt(token);

      this.role = this.getClaim(payload, [
        'role',
        'Role',
        'rol',
        'Rol',
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
      ]);

      this.personType = this.getClaim(payload, [
        'personType',
        'PersonType',
        'tipoPersona',
        'TipoPersona',
        'personaTipo',
        'PersonaTipo',
        'tipo',
        'Tipo',
      ]);

      this.isAdmin =
        this.esAdmin ||
        this.role === 'Admin';

      this.isSecurity =
        this.personType === 'Seguridad' ||
        this.role === 'Seguridad';

      this.isMaintenance =
        this.personType === 'Mantenimiento' ||
        this.personType === 'Personal' ||
        this.role === 'Mantenimiento' ||
        this.role === 'Personal';
    } catch {
      this.resetPermissions();
    }
  }

  private getCurrentToken(): string | null {
    if (this.esAdmin) {
      return localStorage.getItem('accessToken');
    }

    return (
      localStorage.getItem('personaAccessToken') ??
      localStorage.getItem('accessToken')
    );
  }

  private decodeJwt(token: string): any {
    const payload = token.split('.')[1];

    if (!payload) {
      throw new Error('Token inválido');
    }

    const normalizedPayload = payload
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

  private resetPermissions(): void {
    this.role = '';
    this.personType = '';

    this.isAdmin = this.esAdmin;
    this.isSecurity = false;
    this.isMaintenance = false;
  }

  clearFilters(): void {
    this.searchTerm = '';

    this.selectedClass = 'all';
    this.selectedStatus = 'all';
    this.selectedAssignment = 'all';
    this.selectedPriority = 'all';
    this.selectedDeadline = 'all';
    this.selectedSort = 'recent';

    this.applyFilters();
  }

  private ejecutarAccion(
    action: () => void
  ): void {
    if (this.isBusy()) return;

    this.accionEnProceso = true;

    action();

    setTimeout(() => {
      this.accionEnProceso = false;
    }, 600);
  }

  private isBusy(): boolean {
    return (
      this.accionEnProceso ||
      this.isLoading
    );
  }
}