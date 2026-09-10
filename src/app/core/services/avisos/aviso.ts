import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../config/api.config';

// =========================================================
// ENUMS
// =========================================================

export enum PrioridadAviso {
  Informativo = 1,
  Importante = 2,
  Urgente = 3,
}

export enum AudienciaAviso {
  Todos = 1,
  Residentes = 2,
  Seguridad = 3,
  Mantenimiento = 4,
}

// =========================================================
// RESPONSE
// =========================================================

export interface AvisoResponse {
  id: string;

  titulo: string;
  mensaje: string;

  prioridad: PrioridadAviso;
  audiencia: AudienciaAviso;

  fechaPublicacion: string;
  fechaExpiracion: string | null;

  archivoUrl: string | null;
  nombreArchivo: string | null;
  tipoArchivo: string | null;

  activo: boolean;

  creadoPorId: string;

  fechaCreacion: string;
  fechaActualizacion: string | null;
}

// =========================================================
// REQUEST - CREAR
// =========================================================

export interface CrearAvisoRequest {
  titulo: string;
  mensaje: string;

  prioridad: PrioridadAviso;
  audiencia: AudienciaAviso;

  fechaPublicacion: string;
  fechaExpiracion?: string | null;
}

// =========================================================
// REQUEST - ACTUALIZAR
// =========================================================

export interface ActualizarAvisoRequest {
  titulo: string;
  mensaje: string;

  prioridad: PrioridadAviso;
  audiencia: AudienciaAviso;

  fechaPublicacion: string;
  fechaExpiracion?: string | null;
}

// =========================================================
// REQUEST - CAMBIAR ESTADO
// =========================================================

export interface CambiarEstadoAvisoRequest {
  activo: boolean;
}

// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class Aviso {

  private readonly apiUrl = `${API_CONFIG.baseUrl}/Avisos`;

  constructor(
    private readonly http: HttpClient
  ) {}

// =======================================================
// ADMIN - CREAR
// =======================================================

  crear(
  request: CrearAvisoRequest,
  archivo?: File | null
  ): Observable<AvisoResponse> {

    const formData = new FormData();

    formData.append(
      'Titulo',
      request.titulo
    );

    formData.append(
      'Mensaje',
      request.mensaje
    );

    formData.append(
      'Prioridad',
      request.prioridad.toString()
    );

    formData.append(
      'Audiencia',
      request.audiencia.toString()
    );

    formData.append(
      'FechaPublicacion',
      request.fechaPublicacion
    );

    if (request.fechaExpiracion) {
      formData.append(
        'FechaExpiracion',
        request.fechaExpiracion
      );
    }

    if (archivo) {
      formData.append(
        'Archivo',
        archivo,
        archivo.name
      );
    }

    return this.http.post<AvisoResponse>(
      this.apiUrl,
      formData
    );
  }
  // =======================================================
  // ADMIN - OBTENER TODOS
  // =======================================================

  obtenerTodos(): Observable<AvisoResponse[]> {
    return this.http.get<AvisoResponse[]>(
      this.apiUrl
    );
  }

  // =======================================================
  // ADMIN - OBTENER POR ID
  // =======================================================

  obtenerPorId(
    avisoId: string
  ): Observable<AvisoResponse> {
    return this.http.get<AvisoResponse>(
      `${this.apiUrl}/${avisoId}`
    );
  }

  // =======================================================
  // PERSONA - OBTENER MIS AVISOS
  // =======================================================

  obtenerMisAvisos(): Observable<AvisoResponse[]> {
    return this.http.get<AvisoResponse[]>(
      `${this.apiUrl}/mis-avisos`
    );
  }

// =======================================================
// ADMIN - ACTUALIZAR
// =======================================================

  actualizar(
  avisoId: string,
  request: ActualizarAvisoRequest,
  archivo?: File | null
  ): Observable<AvisoResponse> {

    const formData = new FormData();

    formData.append(
      'Titulo',
      request.titulo
    );

    formData.append(
      'Mensaje',
      request.mensaje
    );

    formData.append(
      'Prioridad',
      request.prioridad.toString()
    );

    formData.append(
      'Audiencia',
      request.audiencia.toString()
    );

    formData.append(
      'FechaPublicacion',
      request.fechaPublicacion
    );

    if (request.fechaExpiracion) {
      formData.append(
        'FechaExpiracion',
        request.fechaExpiracion
      );
    }

    if (archivo) {
      formData.append(
        'Archivo',
        archivo,
        archivo.name
      );
    }

    return this.http.put<AvisoResponse>(
      `${this.apiUrl}/${avisoId}`,
      formData
    );
  }

  // =======================================================
  // ADMIN - CAMBIAR ESTADO
  // =======================================================

  cambiarEstado(
    avisoId: string,
    request: CambiarEstadoAvisoRequest
  ): Observable<AvisoResponse> {
    return this.http.patch<AvisoResponse>(
      `${this.apiUrl}/${avisoId}/estado`,
      request
    );
  }

  obtenerArchivoUrl(
    avisoId: string
  ): string {
    return `${this.apiUrl}/${avisoId}/archivo`;
  }

  // =======================================================
  // ADMIN - ELIMINAR
  // =======================================================

  eliminar(
    avisoId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${avisoId}`
    );
  }
}