import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export enum EstadoPaquete {
  Pendiente = 'Pendiente',
  Entregado = 'Entregado',
}

export interface RegistrarPaqueteRequest {
  personaDestinatariaId: string;
  nombreDestinatario: string;
  torre: string;
  apartamento: string;
  descripcion: string;
  foto?: File | null;
}

export interface EntregarPaqueteRequest {
  entregadoA: string;
  firmaRecibido: string;
}

export interface PaqueteResponse {
  id: string;
  nombreDestinatario: string;
  descripcion: string;
  torre: string;
  apartamento: string;
  estado: EstadoPaquete;
  fechaRecepcion: string;
  entregadoA: string | null;
  entregadoPor: string | null;
  fechaEntrega?: string | null;
  fotoUrl?: string | null;
}

export interface PaqueteDetalleResponse {
  id: string;

  nombreDestinatario: string;
  torre: string;
  apartamento: string;
  descripcion: string;

  fechaRecepcion: string;
  fechaEntrega: string | null;

  estado: string;

  recibidoPorId: string;
  recibidoPorNombre: string;

  entregadoPorId: string | null;
  entregadoPorNombre: string | null;

  entregadoA: string | null;
  firmaRecibido: string | null;
  fotoUrl: string | null;
}

export interface NotificacionResponse {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fechaCreacion: string;
  paqueteId: string | null;
}

export interface RegistrarPaqueteResponse {
  mensaje: string;
  paquete: PaqueteResponse;
}

@Injectable({
  providedIn: 'root',
})
export class PaqueteService {
  private readonly baseUrl =
    'https://localhost:7232/api/Paquete';

  constructor(private readonly http: HttpClient) {}

  registrar(
    request: RegistrarPaqueteRequest
  ): Observable<RegistrarPaqueteResponse> {
    const formData = new FormData();

    formData.append(
      'PersonaDestinatariaId',
      request.personaDestinatariaId
    );

    formData.append(
      'NombreDestinatario',
      request.nombreDestinatario
    );

    formData.append(
      'Torre',
      request.torre
    );

    formData.append(
      'Apartamento',
      request.apartamento
    );

    formData.append(
      'Descripcion',
      request.descripcion
    );

    if (request.foto) {
      formData.append(
        'Foto',
        request.foto,
        request.foto.name
      );
    }

    return this.http.post<RegistrarPaqueteResponse>(
      `${this.baseUrl}/registrar`,
      formData
    );
  }

  obtener(): Observable<PaqueteResponse[]> {
    return this.http.get<PaqueteResponse[]>(
      `${this.baseUrl}/obtener`
    );
  }

  obtenerDetalle(
    paqueteId: string
  ): Observable<PaqueteDetalleResponse> {
    return this.http.get<PaqueteDetalleResponse>(
      `${this.baseUrl}/detalle/${paqueteId}`
    );
  }

  entregar(
    paqueteId: string,
    request: EntregarPaqueteRequest
  ): Observable<PaqueteResponse> {
    return this.http.put<PaqueteResponse>(
      `${this.baseUrl}/entregar/${paqueteId}`,
      request
    );
  }

  obtenerMisNotificaciones(): Observable<NotificacionResponse[]> {
    return this.http.get<NotificacionResponse[]>(
      `${this.baseUrl}/mis-notificaciones`
    );
  }
}