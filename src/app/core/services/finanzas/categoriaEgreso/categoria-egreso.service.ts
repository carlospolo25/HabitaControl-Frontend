import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../config/api.config';

export interface CategoriaEgresoResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface RegistrarCategoriaEgresoRequest {
  nombre: string;
  descripcion?: string | null;
}

export interface ActualizarCategoriaEgresoRequest {
  nombre: string;
  descripcion?: string | null;
}

export interface CambiarEstadoCategoriaEgresoRequest {
  activa: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriaEgresoService {
  private readonly apiUrl =
    `${API_CONFIG.baseUrl}/CategoriaEgreso`;

  constructor(private readonly http: HttpClient) {}

  obtener(): Observable<CategoriaEgresoResponse[]> {
    return this.http.get<CategoriaEgresoResponse[]>(
      `${this.apiUrl}/obtener`
    );
  }

  obtenerActivas(): Observable<CategoriaEgresoResponse[]> {
    return this.http.get<CategoriaEgresoResponse[]>(
      `${this.apiUrl}/activas`
    );
  }

  obtenerPorId(id: string): Observable<CategoriaEgresoResponse> {
    return this.http.get<CategoriaEgresoResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  registrar(
    request: RegistrarCategoriaEgresoRequest
  ): Observable<CategoriaEgresoResponse> {
    return this.http.post<CategoriaEgresoResponse>(
      `${this.apiUrl}/registrar`,
      request
    );
  }

  actualizar(
    id: string,
    request: ActualizarCategoriaEgresoRequest
  ): Observable<CategoriaEgresoResponse> {
    return this.http.put<CategoriaEgresoResponse>(
      `${this.apiUrl}/actualizar/${id}`,
      request
    );
  }

  cambiarEstado(
    id: string,
    activa: boolean
  ): Observable<CategoriaEgresoResponse> {
    const request: CambiarEstadoCategoriaEgresoRequest = {
      activa,
    };

    return this.http.patch<CategoriaEgresoResponse>(
      `${this.apiUrl}/cambiar-estado/${id}`,
      request
    );
  }
}