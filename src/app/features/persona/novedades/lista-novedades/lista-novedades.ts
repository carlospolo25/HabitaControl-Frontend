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
import { NovedadService } from '../../../../core/services/novedad/novedad';

@Component({
  selector: 'app-lista-novedades',
  standalone: true,
 imports: [
  CommonModule,
  FormsModule,
  NovedadAsignar,
  NovedadEventosDetalle,
],
  templateUrl: './lista-novedades.html',
  styleUrl: './lista-novedades.css',
})
export class ListaNovedadesComponent implements OnInit {
  @Input() esAdmin = false;

  @Output() iniciarSeguimiento = new EventEmitter<string>();
  @Output() finalizarSeguimiento = new EventEmitter<string>();
  @Output() verHistorial = new EventEmitter<string>();

  novedades: any[] = [];
  filteredNovedades: any[] = [];

  searchTerm = '';

  selectedStatus = 'all';

  selectedAssignment = 'all';

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

  private accionEnProceso = false;

  constructor(
    private readonly novedadService: NovedadService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserPermissions();
    this.cargar();
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
            'No fue posible cargar las novedades.';
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

    this.ejecutarAccion(() => this.iniciarSeguimiento.emit(id));
  }

  abrirFinalizacion(id: string): void {
    if (!this.canFinishTracking() || this.isBusy()) return;

    this.ejecutarAccion(() => this.finalizarSeguimiento.emit(id));
  }

  shouldLoadAssignedNews(): boolean {
    return !this.isAdmin && (this.isSecurity || this.isMaintenance);
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
    return this.isAdmin || this.isSecurity || this.isMaintenance;
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

    if (this.selectedStatus !== 'all') {
      data = data.filter(
        (n) => n.estado === this.selectedStatus
      );
    }

    if (this.selectedAssignment === 'assigned') {
      data = data.filter(
        (n) => !!n.asignadaA
      );
    }

    if (this.selectedAssignment === 'unassigned') {
      data = data.filter(
        (n) => !n.asignadaA
      );
    }

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
            (b.totalEventos ?? 0) -
            (a.totalEventos ?? 0)
        );
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

      this.isAdmin = this.esAdmin || this.role === 'Admin';
      this.isSecurity = this.personType === 'Seguridad' || this.role === 'Seguridad';
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

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalizedPayload));
  }

  private getClaim(payload: any, keys: string[]): string {
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
    this.selectedStatus = 'all';
    this.selectedAssignment = 'all';
    this.selectedSort = 'recent';

    this.applyFilters();
  }

  private ejecutarAccion(action: () => void): void {
    if (this.isBusy()) return;

    this.accionEnProceso = true;
    action();

    setTimeout(() => {
      this.accionEnProceso = false;
    }, 600);
  }

  private isBusy(): boolean {
    return this.accionEnProceso || this.isLoading;
  }
}