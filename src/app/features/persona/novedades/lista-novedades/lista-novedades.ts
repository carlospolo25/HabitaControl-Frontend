import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { finalize } from 'rxjs';

import { NovedadAsignar } from '../novedad-asignar/novedad-asignar';
import { NovedadEventosDetalle } from '../novedad-eventos-detalle/novedad-eventos-detalle';
import { NovedadService } from '../../../../core/services/novedad/novedad';

@Component({
  selector: 'app-lista-novedades',
  standalone: true,
  imports: [CommonModule, NovedadAsignar, NovedadEventosDetalle],
  templateUrl: './lista-novedades.html',
  styleUrl: './lista-novedades.css',
})
export class ListaNovedadesComponent implements OnInit {
  @Input() esAdmin = false;

  @Output() iniciarSeguimiento = new EventEmitter<string>();
  @Output() finalizarSeguimiento = new EventEmitter<string>();
  @Output() verHistorial = new EventEmitter<string>();

  novedades: any[] = [];

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
          this.novedades = Array.isArray(response) ? response : [];
        },
        error: (err) => {
          this.novedades = [];
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