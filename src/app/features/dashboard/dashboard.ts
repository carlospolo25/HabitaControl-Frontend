import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth';
import { PersonsComponent } from '../persona/persons/persons.component';
import {ListaVisitantesComponent}from '../persona/visitante/lista-visitantes/lista-visitantes';
import {ListaNovedadesComponent}from '../persona/novedades/lista-novedades/lista-novedades';
import { FormSeguimientoComponent } from '../persona/novedades/form-seguimiento/form-seguimiento';
import {ListaPaquetesComponent }from '../persona/paquetes/lista-paquetes/lista-paquetes';
import {GestionFinanzas} from '../finanzas/gestion-finanzas/gestion-finanzas'
import {DashboardOverview} from '../resumen/dashboard-overview/dashboard-overview'
import { ZonasComunesComponent } from '../persona/reservas/zonas-comunes/zonas-comunes';
import {GestionReservasComponent} from '../persona/reservas/gestion-zonas-comunes/gestion-reservas'
import {PerfilUsuarioComponent} from '../perfiles/perfil-usuario/perfil-usuario/perfil-usuario'


@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    PersonsComponent,
    ListaVisitantesComponent,
    ListaNovedadesComponent,
    ListaPaquetesComponent,
    FormSeguimientoComponent,
    DashboardOverview,
    ZonasComunesComponent,
    GestionReservasComponent,
    GestionFinanzas,
    PerfilUsuarioComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardPage {

  seleccionarNovedadId: string = '';

  mostrarPersonaComponent = false;
  mostrarVisitanteComponent = false;
  mostrarNovedadComponent = false;
  mostrarPaqueteComponent = false;
  mostrarReservaComponent = false;
  mostrarsegumientoNovedad = false;
  seFinalizacion = false;
  mostrarResumen = true;
  mostrarZonasComunes = false;
  mostrarFinanzas = false;
  mostrarPerfilUsuario = false;


  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  verPerfilUsuario():void{
    this.resetVistas();

    this.mostrarPerfilUsuario = true;
  }
  
  verResumen():void{
    this.resetVistas();
    this.mostrarResumen = true;
  }

  verFinanzas(): void{
    this.resetVistas();

    this.mostrarFinanzas = true;
  }

  verZonasComunes(): void{
    this.resetVistas();
    this.mostrarZonasComunes = true;
  }

  verSegumiento(novedadId: string) {
    this.seleccionarNovedadId = novedadId;
    this.seFinalizacion  = false;
    this.mostrarsegumientoNovedad = true;
  }

  verFinalizacion(novedadId: string) {
    this.seleccionarNovedadId= novedadId;
    this.seFinalizacion  = true;
    this.mostrarsegumientoNovedad  = true;
  }

  mostrarPersonas(): void {
    this.resetVistas();
    this.mostrarPersonaComponent = true;
  }

  mostrarVisitantes(): void {
    this.resetVistas();
    this.mostrarVisitanteComponent = true;
  }

  mostrarNovedades(): void {
    this.resetVistas();
    this.mostrarNovedadComponent = true;
  }

  mostrarPaquetes(): void {
    this.resetVistas();
    this.mostrarPaqueteComponent = true;
  }

  mostrarReservas(): void {
    this.resetVistas();
    this.mostrarReservaComponent = true;
  }

  private resetVistas(): void {
    this.mostrarPersonaComponent = false;
    this.mostrarVisitanteComponent = false;
    this.mostrarNovedadComponent = false;
    this.mostrarPaqueteComponent = false;
    this.mostrarReservaComponent = false;
    this.mostrarZonasComunes = false;
    this.mostrarFinanzas = false;
    this.mostrarResumen = false;
    this.mostrarPerfilUsuario = false;

  }

  logout(): void {
    const confirmLogout = confirm('¿Quieres cerrar sesión?');

    if (!confirmLogout) {
      return;
    }

    this.authService.clearSession();                                        
    this.router.navigate(['/login']);

    this.authService.logout().subscribe({
      next: () => {},
      error: () => {}
    });
  }
}