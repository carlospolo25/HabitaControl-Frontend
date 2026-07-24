import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoriaIngresoResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface RegistrarCategoriaIngresoRequest {
  nombre: string;
  descripcion?: string | null;
}

export interface ActualizarCategoriaIngresoRequest {
  nombre: string;
  descripcion?: string | null;
}

export interface CambiarEstadoCategoriaIngresoRequest {
  activa: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriaIngresoService {
  private readonly apiUrl =
    'https://localhost:7232/api/CategoriaIngreso';

  constructor(private readonly http: HttpClient) {}

  obtener(): Observable<CategoriaIngresoResponse[]> {
    return this.http.get<CategoriaIngresoResponse[]>(
      `${this.apiUrl}/obtener`
    );
  }

  obtenerActivas(): Observable<CategoriaIngresoResponse[]> {
    return this.http.get<CategoriaIngresoResponse[]>(
      `${this.apiUrl}/activas`
    );
  }

  obtenerPorId(id: string): Observable<CategoriaIngresoResponse> {
    return this.http.get<CategoriaIngresoResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  registrar(
    request: RegistrarCategoriaIngresoRequest
  ): Observable<CategoriaIngresoResponse> {
    return this.http.post<CategoriaIngresoResponse>(
      `${this.apiUrl}/registrar`,
      request
    );
  }

  actualizar(
    id: string,
    request: ActualizarCategoriaIngresoRequest
  ): Observable<CategoriaIngresoResponse> {
    return this.http.put<CategoriaIngresoResponse>(
      `${this.apiUrl}/actualizar/${id}`,
      request
    );
  }

  cambiarEstado(
    id: string,
    activa: boolean
  ): Observable<CategoriaIngresoResponse> {
    const request: CambiarEstadoCategoriaIngresoRequest = {
      activa,
    };

    return this.http.patch<CategoriaIngresoResponse>(
      `${this.apiUrl}/cambiar-estado/${id}`,
      request
    );
  }
}