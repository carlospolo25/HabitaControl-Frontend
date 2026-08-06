import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  EstadoPaquete,
  PaqueteResponse,
  PaqueteService,
} from '../../../../core/services/paquete/paquete';

import {
  FormEntregaPaqueteComponent,
} from '../form-entrega-paquete/form-entrega-paquete';

type PackageSortOption =
  | 'recent'
  | 'oldest'
  | 'status';

@Component({
  selector: 'app-lista-paquetes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormEntregaPaqueteComponent,
  ],
  templateUrl: './lista-paquetes.html',
  styleUrl: './lista-paquetes.css',
})
export class ListaPaquetesComponent implements OnInit {
  readonly EstadoPaquete = EstadoPaquete;

  paquetes: PaqueteResponse[] = [];
  paquetesFiltrados: PaqueteResponse[] = [];

  searchTerm = '';
  selectedStatus = 'all';
  selectedTower = '';
  selectedApartment = '';
  selectedSort: PackageSortOption = 'recent';

  isLoading = false;
  errorMessage = '';

  mostrarEntrega = false;
  paqueteSeleccionadoId = '';

  isSecurity = false;

  constructor(
    private readonly paqueteService: PaqueteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPermisos();
    this.cargar();
  }

  get torresDisponibles(): string[] {
    return [
      ...new Set(
        this.paquetes
          .map((paquete) => this.normalizarValor(paquete.torre))
          .filter((torre): torre is string => Boolean(torre))
      ),
    ].sort((a, b) =>
      a.localeCompare(b, 'es', {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }

  get apartamentosDisponibles(): string[] {
    return [
      ...new Set(
        this.paquetes
          .filter((paquete) => {
            if (!this.selectedTower) {
              return true;
            }

            return (
              this.normalizarValor(paquete.torre) ===
              this.selectedTower
            );
          })
          .map((paquete) =>
            this.normalizarValor(paquete.apartamento)
          )
          .filter(
            (apartamento): apartamento is string =>
              Boolean(apartamento)
          )
      ),
    ].sort((a, b) =>
      a.localeCompare(b, 'es', {
        numeric: true,
        sensitivity: 'base',
      })
    );
  }

  get hayFiltrosActivos(): boolean {
    return Boolean(
      this.searchTerm.trim() ||
      this.selectedStatus !== 'all' ||
      this.selectedTower ||
      this.selectedApartment ||
      this.selectedSort !== 'recent'
    );
  }

  get puedeEntregar(): boolean {
    return this.isSecurity;
  }

  cargar(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.paqueteService
      .obtener()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: PaqueteResponse[]) => {
          this.paquetes = Array.isArray(response)
            ? response
            : [];

          this.aplicarFiltros();
        },
        error: (error: HttpErrorResponse) => {
          this.paquetes = [];
          this.paquetesFiltrados = [];

          this.errorMessage = this.obtenerMensajeError(
            error,
            'No fue posible cargar los paquetes.'
          );
        },
      });
  }

  aplicarFiltros(): void {
    let resultado = [...this.paquetes];

    const termino = this.normalizarBusqueda(
      this.searchTerm
    );

    if (termino) {
      resultado = resultado.filter((paquete) => {
        const valores = [
          paquete.nombreDestinatario,
          paquete.descripcion,
          paquete.torre,
          paquete.apartamento,
          paquete.entregadoA,
          paquete.estado,
        ];

        return valores.some((valor) =>
          this.normalizarBusqueda(valor).includes(termino)
        );
      });
    }

    if (this.selectedStatus !== 'all') {
      resultado = resultado.filter(
        (paquete) =>
          String(paquete.estado) === this.selectedStatus
      );
    }

    if (this.selectedTower) {
      resultado = resultado.filter(
        (paquete) =>
          this.normalizarValor(paquete.torre) ===
          this.selectedTower
      );
    }

    if (this.selectedApartment) {
      resultado = resultado.filter(
        (paquete) =>
          this.normalizarValor(paquete.apartamento) ===
          this.selectedApartment
      );
    }

    resultado.sort((a, b) => {
      switch (this.selectedSort) {
        case 'oldest':
          return (
            this.obtenerFecha(a.fechaRecepcion) -
            this.obtenerFecha(b.fechaRecepcion)
          );

        case 'status':
          return this.obtenerOrdenEstado(a.estado) -
            this.obtenerOrdenEstado(b.estado);

        case 'recent':
        default:
          return (
            this.obtenerFecha(b.fechaRecepcion) -
            this.obtenerFecha(a.fechaRecepcion)
          );
      }
    });

    this.paquetesFiltrados = resultado;
  }

  cambiarTorre(): void {
    if (
      this.selectedApartment &&
      !this.apartamentosDisponibles.includes(
        this.selectedApartment
      )
    ) {
      this.selectedApartment = '';
    }

    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedStatus = 'all';
    this.selectedTower = '';
    this.selectedApartment = '';
    this.selectedSort = 'recent';

    this.aplicarFiltros();
  }

  abrirEntrega(paqueteId: string): void {
    if (
      !this.isSecurity ||
      !paqueteId ||
      this.mostrarEntrega
    ) {
      return;
    }

    this.paqueteSeleccionadoId = paqueteId;
    this.mostrarEntrega = true;
  }

  cerrarEntrega(): void {
    this.mostrarEntrega = false;
    this.paqueteSeleccionadoId = '';
  }

  entregaCompletada(): void {
    this.cerrarEntrega();
    this.cargar();
  }

  trackByPaquete(
    index: number,
    paquete: PaqueteResponse
  ): string {
    return paquete.id;
  }

  private cargarPermisos(): void {
    const token = localStorage.getItem(
      'personaAccessToken'
    );

    this.isSecurity = false;

    if (!token) {
      return;
    }

    const claims = this.decodificarToken(token);

    if (!claims) {
      return;
    }

    const tipoClaim =
      claims['Tipo'] ??
      claims['tipo'] ??
      claims['TipoPersona'] ??
      claims['tipoPersona'] ??
      claims['personType'] ??
      claims['PersonType'];

    if (typeof tipoClaim === 'string') {
      const tipoNormalizado = tipoClaim
        .trim()
        .toLowerCase();

      this.isSecurity =
        tipoNormalizado === 'seguridad' ||
        tipoNormalizado === '2';

      return;
    }

    if (typeof tipoClaim === 'number') {
      this.isSecurity = tipoClaim === 2;
    }
  }

  private decodificarToken(
    token: string
  ): Record<string, unknown> | null {
    try {
      const partes = token.split('.');

      if (partes.length !== 3) {
        return null;
      }

      const payload = partes[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payloadConPadding = payload.padEnd(
        payload.length +
          ((4 - (payload.length % 4)) % 4),
        '='
      );

      return JSON.parse(
        atob(payloadConPadding)
      ) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private obtenerOrdenEstado(
    estado: EstadoPaquete | string
  ): number {
    const estadoNormalizado = String(estado)
      .trim()
      .toLowerCase();

    if (
      estadoNormalizado ===
      String(EstadoPaquete.Pendiente).toLowerCase()
    ) {
      return 0;
    }

    if (
      estadoNormalizado ===
      String(EstadoPaquete.Entregado).toLowerCase()
    ) {
      return 2;
    }

    return 99;
  }

  private obtenerFecha(
    fecha: string | Date | null | undefined
  ): number {
    if (!fecha) {
      return 0;
    }

    const valor = new Date(fecha).getTime();

    return Number.isNaN(valor)
      ? 0
      : valor;
  }

  private normalizarValor(
    valor: unknown
  ): string {
    if (
      valor === null ||
      valor === undefined
    ) {
      return '';
    }

    return String(valor).trim();
  }

  private normalizarBusqueda(
    valor: unknown
  ): string {
    return this.normalizarValor(valor)
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    if (error.status === 0) {
      return 'No fue posible conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    }

    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (
      typeof error.error?.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message;
    }

    if (
      typeof error.error?.detail === 'string' &&
      error.error.detail.trim()
    ) {
      return error.error.detail;
    }

    if (error.error?.errors) {
      const mensajes = Object.values(
        error.error.errors
      )
        .flat()
        .filter(
          (mensaje): mensaje is string =>
            typeof mensaje === 'string'
        );

      if (mensajes.length > 0) {
        return mensajes.join(' ');
      }
    }

    switch (error.status) {
      case 400:
        return 'La solicitud contiene información inválida.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para consultar los paquetes.';

      case 404:
        return 'No se encontró la información solicitada.';

      case 409:
        return 'No fue posible completar la operación por el estado actual del paquete.';

      default:
        return mensajePredeterminado;
    }
  }
}