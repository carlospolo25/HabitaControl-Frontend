import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../config/api.config';

// =========================================================
// ENUM
// =========================================================

export enum CategoriaNormaConvivencia {
  General = 1,
  Ruido = 2,
  Mascotas = 3,
  Parqueaderos = 4,
  ZonasComunes = 5,
  Residuos = 6,
  Seguridad = 7,
  Visitantes = 8,
  Convivencia = 9,
  Otro = 10,
}

// =========================================================
// RESPONSE
// =========================================================

export interface NormaConvivenciaResponse {
  id: string;

  titulo: string;
  contenido: string;

  categoria: CategoriaNormaConvivencia;
  orden: number;

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

export interface CrearNormaConvivenciaRequest {
  titulo: string;
  contenido: string;

  categoria: CategoriaNormaConvivencia;
  orden: number;
}

// =========================================================
// REQUEST - ACTUALIZAR
// =========================================================

export interface ActualizarNormaConvivenciaRequest {
  titulo: string;
  contenido: string;

  categoria: CategoriaNormaConvivencia;
  orden: number;
}

// =========================================================
// REQUEST - CAMBIAR ESTADO
// =========================================================

export interface CambiarEstadoNormaConvivenciaRequest {
  activo: boolean;
}

// =========================================================
// SERVICE
// =========================================================

@Injectable({
  providedIn: 'root',
})
export class NormaConvivencia {

  private readonly apiUrl = `${API_CONFIG.baseUrl}/NormasConvivencia`;

  constructor(
    private readonly http: HttpClient
  ) {}

// =======================================================
// ADMIN - CREAR
// =======================================================

  crear(
  request: CrearNormaConvivenciaRequest,
  archivo?: File | null
  ): Observable<NormaConvivenciaResponse> {

    const formData = new FormData();

    formData.append(
      'Titulo',
      request.titulo
    );

    formData.append(
      'Contenido',
      request.contenido
    );

    formData.append(
      'Categoria',
      request.categoria.toString()
    );

    formData.append(
      'Orden',
      request.orden.toString()
    );

    if (archivo) {
      formData.append(
        'Archivo',
        archivo,
        archivo.name
      );
    }

    return this.http.post<NormaConvivenciaResponse>(
      this.apiUrl,
      formData
    );
  }

  // =======================================================
  // ADMIN - OBTENER TODAS
  // =======================================================

  obtenerTodas(): Observable<NormaConvivenciaResponse[]> {
    return this.http.get<NormaConvivenciaResponse[]>(
      this.apiUrl
    );
  }

  // =======================================================
  // ADMIN - OBTENER POR ID
  // =======================================================

  obtenerPorId(
    normaId: string
  ): Observable<NormaConvivenciaResponse> {
    return this.http.get<NormaConvivenciaResponse>(
      `${this.apiUrl}/${normaId}`
    );
  }

  // =======================================================
  // PERSONAS - OBTENER NORMAS ACTIVAS
  // =======================================================

  obtenerMisNormas(): Observable<NormaConvivenciaResponse[]> {
    return this.http.get<NormaConvivenciaResponse[]>(
      `${this.apiUrl}/mis-normas`
    );
  }

// =======================================================
// ADMIN - ACTUALIZAR
// =======================================================

  actualizar(
  normaId: string,
  request: ActualizarNormaConvivenciaRequest,
  archivo?: File | null
  ): Observable<NormaConvivenciaResponse> {

    const formData = new FormData();

    formData.append(
      'Titulo',
      request.titulo
    );

    formData.append(
      'Contenido',
      request.contenido
    );

    formData.append(
      'Categoria',
      request.categoria.toString()
    );

    formData.append(
      'Orden',
      request.orden.toString()
    );

    if (archivo) {
      formData.append(
        'Archivo',
        archivo,
        archivo.name
      );
    }

    return this.http.put<NormaConvivenciaResponse>(
      `${this.apiUrl}/${normaId}`,
      formData
    );
  }

  // =======================================================
  // ADMIN - CAMBIAR ESTADO
  // =======================================================

  cambiarEstado(
    normaId: string,
    request: CambiarEstadoNormaConvivenciaRequest
  ): Observable<NormaConvivenciaResponse> {
    return this.http.patch<NormaConvivenciaResponse>(
      `${this.apiUrl}/${normaId}/estado`,
      request
    );
  }

  obtenerArchivoUrl(
    normaId: string
  ): string {
    return `${this.apiUrl}/${normaId}/archivo`;
  }

  // =======================================================
  // ADMIN - ELIMINAR
  // =======================================================

  eliminar(
    normaId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${normaId}`
    );
  }
}