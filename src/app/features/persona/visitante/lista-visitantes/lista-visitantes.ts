import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  VisitanteResponse,
  VisitanteService,
} from '../../../../core/services/visitante/visitante';

import { AuthService } from '../../../../core/services/auth/auth';

import {
  Observable,
  catchError,
  map,
  of,
} from 'rxjs';

import {
  AuthPersona,
} from '../../../../core/services/authPersona/auth-persona';

import {
  AuthSessionContext,
} from '../../../../core/Auth/auth-session-context';

import {
  formatearInstanteColombia
} from '../../../../core/utils/colombia-date.util';

@Component({
  selector: 'app-lista-visitantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-visitantes.html',
  styleUrl: './lista-visitantes.css',
})
export class ListaVisitantesComponent implements OnInit {
  visitantes: VisitanteResponse[] = [];

  private readonly backendUrl =
  'https://localhost:7232';

  visitanteDetalle: VisitanteResponse | null = null;
  mostrarDetalleVisitante = false;
  fotoVisitanteSeleccionada: VisitanteResponse | null = null;
  mostrarFotoVisitante = false;
  tipo = '';
  isLoading = false;
  visitanteProcesandoId: string | null = null;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  selectedDate = '';
  selectedApartment = '';
  selectedTorre = '';

  constructor(
    private readonly visitanteService: VisitanteService,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly authPersona: AuthPersona,
    private readonly sessionContext: AuthSessionContext
  ) {}

  ngOnInit(): void {
    this.obtenerTipo().subscribe({
      next: (tipo) => {
        this.tipo = tipo;

        console.log(
          'Tipo detectado:',
          this.tipo
        );

        this.cargar();
      },

      error: (error) => {
        console.error(
          'Error determinando el tipo de usuario:',
          error
        );

        this.tipo = '';
        this.cargar();
      },
    });
  }

  get puedeUsarFiltrosAvanzados(): boolean {
    const tipoNormalizado = this.tipo.trim().toLowerCase();

    return (
      tipoNormalizado === 'seguridad' ||
      tipoNormalizado === 'admin'
    );
  }

  get torresDisponibles(): string[] {
    return Array.from(
      new Set(
        this.visitantes
          .map((visitante) => visitante.torre?.trim())
          .filter((torre): torre is string => Boolean(torre))
      )
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }

  get apartamentosDisponibles(): string[] {
    return Array.from(
      new Set(
        this.visitantes
          .map((visitante) => visitante.apartamento?.trim())
          .filter(
            (apartamento): apartamento is string =>
              Boolean(apartamento)
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }

  get visitantesFiltrados(): VisitanteResponse[] {
    if (!this.puedeUsarFiltrosAvanzados) {
      return this.visitantes;
    }

    const busqueda = this.normalizarTexto(this.searchTerm);

    const apartamentoSeleccionado = this.normalizarTexto(
      this.selectedApartment
    );

    const torreSeleccionada = this.normalizarTexto(
      this.selectedTorre
    );

    return this.visitantes.filter((visitante) => {
      const coincideBusqueda =
        !busqueda ||
        [
          visitante.nombre,
          visitante.documento,
          visitante.torre,
          visitante.apartamento,
          visitante.autorizadoPorNombre,
          visitante.estado,
        ].some((valor) =>
          this.normalizarTexto(valor).includes(busqueda)
        );

      const coincideApartamento =
        !apartamentoSeleccionado ||
        this.normalizarTexto(visitante.apartamento) ===
          apartamentoSeleccionado;

      const coincideTorre =
        !torreSeleccionada ||
        this.normalizarTexto(visitante.torre) ===
          torreSeleccionada;

      const coincideFecha =
        !this.selectedDate ||
        this.obtenerFechaLocal(visitante.fechaIngreso) ===
          this.selectedDate;

      return (
        coincideBusqueda &&
        coincideApartamento &&
        coincideTorre &&
        coincideFecha
      );
    });
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedDate = '';
    this.selectedApartment = '';
    this.selectedTorre = '';
  }

  abrirFotoVisitante(
    visitante: VisitanteResponse
  ): void {
    if (!this.tieneFoto(visitante)) {
      return;
    }

    this.fotoVisitanteSeleccionada = visitante;
    this.mostrarFotoVisitante = true;
  }

  cerrarFotoVisitante(): void {
    this.mostrarFotoVisitante = false;
    this.fotoVisitanteSeleccionada = null;
  }

  get hayFiltrosActivos(): boolean {
    return Boolean(
      this.searchTerm.trim() ||
      this.selectedDate ||
      this.selectedApartment ||
      this.selectedTorre
    );
  }

  private normalizarTexto(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private obtenerFechaLocal(
    fecha: string
  ): string {
    if (!fecha) {
      return '';
    }

    const fechaColombia =
      formatearInstanteColombia(
        fecha,
        {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: undefined,
          minute: undefined,
          second: undefined,
        }
      );

    if (!fechaColombia) {
      return '';
    }

    const partes =
      fechaColombia.split('/');

    if (partes.length !== 3) {
      return '';
    }

    const [day, month, year] = partes;

    return `${year}-${month}-${day}`;
  }

  cargar(): void {
    if (this.isLoading) {
      return;
    }

    this.limpiarMensajes();
    this.isLoading = true;

    this.visitanteService
      .obtener()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.visitantes = data ?? [];
        },
        error: (err: HttpErrorResponse) => {
          this.visitantes = [];
          this.errorMessage = this.obtenerMensajeError(
            err,
            'Ocurrió un error al obtener los visitantes.'
          );
        },
      });
  }

  tieneFoto(
    visitante: VisitanteResponse
  ): boolean {
    return Boolean(
      visitante.fotoUrl?.trim()
    );
  }

  obtenerFotoUrl(
    fotoUrl: string | null | undefined
  ): string | null {
    if (!fotoUrl) {
      return null;
    }

    const url = fotoUrl.trim();

    if (!url) {
      return null;
    }

    if (
      url.startsWith('http://') ||
      url.startsWith('https://')
    ) {
      return url;
    }

    return `${this.backendUrl}${
      url.startsWith('/') ? '' : '/'
    }${url}`;
  }

  verDetalle(visitante: VisitanteResponse): void {
    this.visitanteDetalle = visitante;
    this.mostrarDetalleVisitante = true;
  }

  cerrarDetalleVisitante(): void {
    this.mostrarDetalleVisitante = false;
    this.visitanteDetalle = null;
  }

  darSalida(visitante: VisitanteResponse): void {
    if (
      !visitante?.id ||
      this.visitanteProcesandoId !== null ||
      !this.puedeRegistrarSalida(visitante)
    ) {
      return;
    }

    this.limpiarMensajes();
    this.visitanteProcesandoId = visitante.id;

    this.visitanteService
      .darSalida(visitante.id)
      .pipe(
        finalize(() => {
          this.visitanteProcesandoId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response?.mensaje || 'Salida registrada correctamente.';

          this.actualizarVisitanteFinalizado(visitante.id);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage = this.obtenerMensajeError(
            err,
            'Ocurrió un error al registrar la salida del visitante.'
          );
        },
      });
  }

  puedeRegistrarSalida(visitante: VisitanteResponse): boolean {
    return (
      this.tipo.toLowerCase() === 'seguridad' &&
      !this.estaFinalizado(visitante)
    );
  }

  estaRegistrandoSalida(id: string): boolean {
    return this.visitanteProcesandoId === id;
  }

  estaFinalizado(visitante: VisitanteResponse): boolean {
    return (
      visitante.estado?.trim().toLowerCase() === 'finalizado' ||
      Boolean(visitante.fechaSalida)
    );
  }

  enmascararDocumento(documento: string): string {
    if (!documento?.trim()) {
      return '—';
    }

    const limpio = documento.trim();

    if (limpio.length <= 4) {
      return '*'.repeat(limpio.length);
    }

    return `${'*'.repeat(limpio.length - 4)}${limpio.slice(-4)}`;
  }

  puedeVerDocumentoCompleto(): boolean {
    return this.tipo.toLowerCase() === 'seguridad';
  }

  mostrarDocumento(documento: string): string {
    return this.puedeVerDocumentoCompleto()
      ? documento || '—'
      : this.enmascararDocumento(documento);
  }

  private actualizarVisitanteFinalizado(id: string): void {
    const fechaSalida = new Date().toISOString();

    this.visitantes = this.visitantes.map((visitante) =>
      visitante.id === id
        ? {
            ...visitante,
            estado: 'Finalizado',
            fechaSalida,
          }
        : visitante
    );

    if (this.visitanteDetalle?.id === id) {
      this.visitanteDetalle = {
        ...this.visitanteDetalle,
        estado: 'Finalizado',
        fechaSalida,
      };
    }
  }

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private obtenerMensajeError(
    err: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    return (
      err.error?.mensaje ||
      err.error?.message ||
      mensajePredeterminado
    );
  }

  private obtenerTipo(): Observable<string> {
    const identityType =
      this.sessionContext
        .getIdentityType();

    if (identityType === 'persona') {
      return this.authPersona
        .comprobarSesion()
        .pipe(
          map((session) => {
            this.sessionContext
              .setPersona();

            return session.tipo ?? '';
          }),

          catchError((error) => {
            console.error(
              'No fue posible validar la sesión Persona:',
              error
            );

            return of('');
          })
        );
    }

    if (identityType === 'admin') {
      return this.authService
        .obtenerPerfil()
        .pipe(
          map(() => {
            this.sessionContext
              .setAdmin();

            return 'Admin';
          }),

          catchError((error) => {
            console.error(
              'No fue posible validar la sesión Admin:',
              error
            );

            return of('');
          })
        );
    }

    return this.obtenerTipoSinContexto();
  }

  private obtenerTipoSinContexto(): Observable<string> {
    return this.authPersona
      .comprobarSesion()
      .pipe(
        map((session) => {
          this.sessionContext
            .setPersona();

          return session.tipo ?? '';
        }),

        catchError(() =>
          this.authService
            .obtenerPerfil()
            .pipe(
              map(() => {
                this.sessionContext
                  .setAdmin();

                return 'Admin';
              }),

              catchError((error) => {
                console.error(
                  'No fue posible determinar la identidad autenticada:',
                  error
                );

                return of('');
              })
            )
        )
      );
  }

}