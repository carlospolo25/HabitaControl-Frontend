import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthPersona } from '../../../core/services/authPersona/auth-persona';

import { MisMascotasComponent } from '../../persona/mis-mascotas/mis-mascotas';

import { MisVehiculosComponent } from '../mis-vehiculos/mis-vehiculos';

import { FormNovedadComponent } from '../novedades/form-novedad/form-novedad';
import { FormSeguimientoComponent } from '../novedades/form-seguimiento/form-seguimiento';
import { ListaNovedadesComponent } from '../novedades/lista-novedades/lista-novedades';

import { FormPaqueteComponent } from '../paquetes/form-paquete/form-paquete';
import { ListaNotificacionesComponent } from '../paquetes/lista-notificaciones/lista-notificaciones';
import { ListaPaquetesComponent } from '../paquetes/lista-paquetes/lista-paquetes';

import { MisReservasComponent } from '../reservas/mis-reservas/mis-reservas';
import { ZonasComunesComponent } from '../reservas/zonas-comunes/zonas-comunes';

import { CrearInvitacionVisitante } from '../visitante/crear-invitacion-visitante/crear-invitacion-visitante';
import { FormVisitanteComponent } from '../visitante/form-visitante/form-visitante';
import { ListaVisitantesComponent } from '../visitante/lista-visitantes/lista-visitantes';

type TipoPersona =
  | 'Residente'
  | 'Seguridad'
  | 'Mantenimiento'
  | '';

type VistaPersona =
  | 'inicio'
  | 'crear-novedad'
  | 'mis-novedades'
  | 'lista-novedades'
  | 'seguimiento-novedad'
  | 'registrar-visitante'
  | 'lista-visitantes'
  | 'registrar-paquete'
  | 'lista-paquetes'
  | 'notificaciones'
  | 'zonas-comunes'
  | 'mis-reservas'
  | 'mis-vehiculos'
  | 'mis-mascotas'
  | 'app-crear-invitacion-visitante';

@Component({
  selector: 'app-dashboard-persona',
  standalone: true,
  imports: [
    CommonModule,

    FormNovedadComponent,
    ListaNovedadesComponent,
    FormSeguimientoComponent,

    FormVisitanteComponent,
    ListaVisitantesComponent,
    CrearInvitacionVisitante,

    FormPaqueteComponent,
    ListaPaquetesComponent,
    ListaNotificacionesComponent,

    ZonasComunesComponent,
    MisReservasComponent,

    MisVehiculosComponent,
    MisMascotasComponent,
  ],
  templateUrl: './dashboard-persona.html',
  styleUrl: './dashboard-persona.css',
})
export class DashboardPersona implements OnInit {

  tipo: TipoPersona = '';
  vistaActiva: VistaPersona = 'inicio';

  novedadSeleccionadaId = '';
  esFinalizacion = false;

  constructor(
    private readonly authPersona: AuthPersona,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.tipo = this.obtenerTipoPersona();
  }

  get puedeReportarNovedad(): boolean {
    return (
      this.tipo === 'Residente' ||
      this.tipo === 'Seguridad'
    );
  }

  get puedeRegistrarVisitantes(): boolean {
    return this.tipo === 'Seguridad';
  }

  get puedeGestionarPaquetes(): boolean {
    return this.tipo === 'Seguridad';
  }

  get puedeVerReservas(): boolean {
    return this.tipo === 'Residente';
  }

  get puedeVerVehiculosYMascotas(): boolean {
    return this.tipo === 'Residente';
  }

  get puedeSeguirNovedades(): boolean {
    return this.tipo === 'Mantenimiento';
  }

  obtenerTipoPersona(): TipoPersona {
    const token = localStorage.getItem(
      'personaAccessToken',
    );

    if (!token) {
      return '';
    }

    try {
      const payload = JSON.parse(
        atob(token.split('.')[1]),
      );

      return payload.Tipo ?? '';
    } catch {
      this.authPersona
        .limpiarSesionPersona();

      this.router.navigate([
        '/loginPersona',
      ]);

      return '';
    }
  }

  cambiarVista(
    vista: VistaPersona,
  ): void {
    this.vistaActiva = vista;
    this.novedadSeleccionadaId = '';
    this.esFinalizacion = false;
  }

  abrirInicio(): void {
    this.cambiarVista('inicio');
  }

  abrirNovedad(): void {
    this.cambiarVista('crear-novedad');
  }

  abrirMisNovedades(): void {
    this.cambiarVista('mis-novedades');
  }

  abrirListaNovedades(): void {
    this.cambiarVista('lista-novedades');
  }

  abrirVisitante(): void {
    this.cambiarVista(
      'registrar-visitante',
    );
  }

  abrirListaVisitantes(): void {
    this.cambiarVista(
      'lista-visitantes',
    );
  }

  invitarVisitantes(): void {
    this.cambiarVista(
      'app-crear-invitacion-visitante',
    );
  }

  abrirFormularioPaquete(): void {
    this.cambiarVista(
      'registrar-paquete',
    );
  }

  abrirPaquetes(): void {
    this.cambiarVista(
      'lista-paquetes',
    );
  }

  abrirNotificaciones(): void {
    this.cambiarVista(
      'notificaciones',
    );
  }

  abrirListasZonaComunesActivas(): void {
    if (!this.puedeVerReservas) {
      return;
    }

    this.cambiarVista(
      'zonas-comunes',
    );
  }

  abrirReservas(): void {
    if (!this.puedeVerReservas) {
      return;
    }

    this.cambiarVista(
      'mis-reservas',
    );
  }

  abrirMisVehiculos(): void {
    if (!this.puedeVerVehiculosYMascotas) {
      return;
    }

    this.cambiarVista(
      'mis-vehiculos',
    );
  }

  abrirMisMascotas(): void {
    if (!this.puedeVerVehiculosYMascotas) {
      return;
    }

    this.cambiarVista(
      'mis-mascotas',
    );
  }

  abrirSegumiento(
    novedadId: string,
  ): void {
    this.novedadSeleccionadaId =
      novedadId;

    this.esFinalizacion = false;

    this.vistaActiva =
      'seguimiento-novedad';
  }

  abrirFinalizacion(
    novedadId: string,
  ): void {
    this.novedadSeleccionadaId =
      novedadId;

    this.esFinalizacion = true;

    this.vistaActiva =
      'seguimiento-novedad';
  }

  cerrarVistaActual(): void {
    this.abrirInicio();
  }

  logout(): void {
    const confirmarSalida = confirm(
      '¿Desea cerrar la sesión?',
    );

    if (!confirmarSalida) {
      return;
    }

    this.authPersona
      .logoutPersona()
      .subscribe({
        next: () =>
          this.finalizarSesion(),

        error: () =>
          this.finalizarSesion(),
      });
  }

  private finalizarSesion(): void {
    this.authPersona
      .limpiarSesionPersona();

    this.router.navigate([
      '/loginPersona',
    ]);
  }
}