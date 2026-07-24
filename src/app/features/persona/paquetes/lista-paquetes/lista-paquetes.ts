import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { finalize } from 'rxjs';

import {
  EstadoPaquete,
  PaqueteResponse,
  PaqueteService,
} from '../../../../core/services/paquete/paquete';

import {
  FormEntregaPaqueteComponent,
} from '../form-entrega-paquete/form-entrega-paquete';

@Component({
  selector: 'app-lista-paquetes',
  standalone: true,
  imports: [
    CommonModule,
    FormEntregaPaqueteComponent,
  ],
  templateUrl: './lista-paquetes.html',
  styleUrl: './lista-paquetes.css',
})
export class ListaPaquetesComponent implements OnInit {
  readonly EstadoPaquete = EstadoPaquete;

  paquetes: PaqueteResponse[] = [];

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
          this.paquetes = response ?? [];
        },
        error: (error: HttpErrorResponse) => {
          this.paquetes = [];

          this.errorMessage = this.obtenerMensajeError(
            error,
            'No fue posible cargar los paquetes.'
          );
        },
      });
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

  get puedeEntregar(): boolean {
    return this.isSecurity;
  }

private cargarPermisos(): void {
  const token = localStorage.getItem('personaAccessToken');

  this.isSecurity = false;

  console.log('TOKEN PERSONA EXISTE:', !!token);

  if (!token) {
    console.warn('No existe personaAccessToken en localStorage.');
    return;
  }

  const claims = this.decodificarToken(token);

  console.log('CLAIMS DECODIFICADOS:', claims);

  if (!claims) {
    console.warn('No fue posible decodificar el token.');
    return;
  }

  console.log('CLAVES DISPONIBLES EN EL TOKEN:', Object.keys(claims));

  const tipoClaim =
    claims['Tipo'] ??
    claims['tipo'] ??
    claims['TipoPersona'] ??
    claims['tipoPersona'] ??
    claims['personType'] ??
    claims['PersonType'];

  console.log('TIPO CLAIM ENCONTRADO:', tipoClaim);
  console.log('TIPO DE DATO DEL CLAIM:', typeof tipoClaim);

  if (typeof tipoClaim === 'string') {
    const tipoNormalizado = tipoClaim
      .trim()
      .toLowerCase();

    console.log('TIPO NORMALIZADO:', tipoNormalizado);

    this.isSecurity =
      tipoNormalizado === 'seguridad' ||
      tipoNormalizado === '2';

    console.log('ES SEGURIDAD:', this.isSecurity);
    return;
  }

  if (typeof tipoClaim === 'number') {
    this.isSecurity = tipoClaim === 2;

    console.log('ES SEGURIDAD POR VALOR NUMÉRICO:', this.isSecurity);
    return;
  }

  console.warn(
    'No se encontró un claim reconocible para TipoPersona.',
    claims
  );
}

private decodificarToken(
  token: string
): Record<string, unknown> | null {
  try {
    const partes = token.split('.');

    console.log('PARTES DEL TOKEN:', partes.length);

    if (partes.length !== 3) {
      console.error('El token no tiene tres partes.');
      return null;
    }

    const payload = partes[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const payloadConPadding = payload.padEnd(
      payload.length + ((4 - payload.length % 4) % 4),
      '='
    );

    const claims = JSON.parse(
      atob(payloadConPadding)
    ) as Record<string, unknown>;

    return claims;
  } catch (error) {
    console.error('ERROR DECODIFICANDO TOKEN:', error);
    return null;
  }
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
      const mensajes = Object.values(error.error.errors)
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