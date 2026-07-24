import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ZonaComunResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  capacidadMaxima: number;
  horaApertura: string;
  horaCierre: string;
  duracionMaximaMinutos: number;
  requiereAprobacion: boolean;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface RegistrarZonaComunRequest {
  nombre: string;
  descripcion: string | null;
  capacidadMaxima: number;
  horaApertura: string;
  horaCierre: string;
  duracionMaximaMinutos: number;
  requiereAprobacion: boolean;
}

export interface ActualizarZonaComunRequest {
  nombre: string;
  descripcion: string | null;
  capacidadMaxima: number;
  horaApertura: string;
  horaCierre: string;
  duracionMaximaMinutos: number;
  requiereAprobacion: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ZonaComunService {
  private readonly apiUrl =
    'https://localhost:7232/api/ZonaComun';

  constructor(
    private readonly http: HttpClient,
  ) {}

  registrar(
    request: RegistrarZonaComunRequest,
  ): Observable<ZonaComunResponse> {
    return this.http.post<ZonaComunResponse>(
      `${this.apiUrl}/registrar`,
      request,
    );
  }

  obtener(): Observable<ZonaComunResponse[]> {
    return this.http.get<ZonaComunResponse[]>(
      `${this.apiUrl}/obtener`,
    );
  }

  obtenerActivas(): Observable<ZonaComunResponse[]> {
    return this.http.get<ZonaComunResponse[]>(
      `${this.apiUrl}/activas`,
    );
  }

  obtenerPorId(
    zonaComunId: string,
  ): Observable<ZonaComunResponse> {
    return this.http.get<ZonaComunResponse>(
      `${this.apiUrl}/obtener/${zonaComunId}`,
    );
  }

  actualizar(
    zonaComunId: string,
    request: ActualizarZonaComunRequest,
  ): Observable<ZonaComunResponse> {
    return this.http.put<ZonaComunResponse>(
      `${this.apiUrl}/actualizar/${zonaComunId}`,
      request,
    );
  }

  cambiarEstado(
    zonaComunId: string,
    activa: boolean,
  ): Observable<ZonaComunResponse> {
    const params = new HttpParams().set(
      'activa',
      activa.toString(),
    );

    return this.http.put<ZonaComunResponse>(
      `${this.apiUrl}/cambiar-estado/${zonaComunId}`,
      null,
      { params },
    );
  }
}