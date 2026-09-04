import { CommonModule } from '@angular/common';
import { ChangeDetectorRef,Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthSessionContext,
} from '../../../core/Auth/auth-session-context';


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
import { PerfilPersonasComponent} from '../../perfiles/perfil-persona/perfil-personas/perfil-personas';
import {PersonsComponent} from '../persons/persons.component'
import { AvisosConvivenciaPersonaComponent } from '../../normaAviso/avisos-convivencia-persona-component/avisos-convivencia-persona-component';

type TipoPersona =
  | 'Residente'
  | 'Seguridad'
  | 'Personal'
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
  | 'app-crear-invitacion-visitante'
  | 'mi-perfil'
  | 'personas'
  | 'avisos-convivencia';

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

    PerfilPersonasComponent,
    PersonsComponent,

    AvisosConvivenciaPersonaComponent,
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
    private readonly sessionContext: AuthSessionContext,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarSesionPersona();
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
    return this.tipo === 'Personal';
  }

  get puedeVerPersonas(): boolean {
    return this.tipo === 'Seguridad';
  }

  cambiarVista(
    vista: VistaPersona,
  ): void {
    this.vistaActiva = vista;
    this.novedadSeleccionadaId = '';
    this.esFinalizacion = false;
  }

  abrirAvisosConvivencia(): void {
    this.cambiarVista(
      'avisos-convivencia'
    );
  }

  abrirPersonas(): void {
    if (!this.puedeVerPersonas) {
      return;
    }

    this.cambiarVista('personas');
  }

  abrirInicio(): void {
    this.cambiarVista('inicio');
  }

  abrirPerfil(): void {
    this.cambiarVista('mi-perfil');
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

  private cargarSesionPersona(): void {
    this.authPersona
      .comprobarSesion()
      .subscribe({
        next: (session) => {
          this.tipo =
            this.normalizarTipoPersona(
              session.tipo
            );

          this.sessionContext
            .setPersona();

          this.cdr.detectChanges();
        },

        error: () => {
          this.tipo = '';

          this.sessionContext
            .clear();

          this.cdr.detectChanges();

          this.router.navigate([
            '/loginPersona',
          ]);
        },
      });
  }

  private normalizarTipoPersona(
    tipo: string
  ): TipoPersona {
    switch (tipo) {
      case 'Residente':
      case 'Seguridad':
      case 'Personal':
        return tipo;

      default:
        return '';
    }
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
        next: () => {
          this.finalizarSesion();
        },

        error: () => {
          this.finalizarSesion();
        },
      });
  }

  private finalizarSesion(): void {
    this.sessionContext.clear();

    this.tipo = '';

    this.router.navigate([
      '/loginPersona',
    ]);
  }
}