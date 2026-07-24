import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CrearNovedadRequest {
  titulo: string;
  tipo: string;
  descripcion: string;
  imagenBase64?: string;
}

export interface AsignarNovedadRequest {
  novedadId: string;
  personaId: string;
}

export interface CrearEventoRequest {
  novedadId: string;
  comentario: string;
  imagenBase64?: string;
}

export interface CerrarNovedadRequest {
  novedadId: string;
  comentario: string;
  imagenBase64?: string;
}

export interface EventoNovedad {
  id: string;
  novedadId: string;
  tipo: string;
  comentario: string;
  imagenUrl?: string;
  registradoPor: string;
  fechaCreacion: string;
}

export interface NovedadResponse {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  fechaCreacion: string;

  reportadaPorId: string;
  reportadaPor: string;

  asignadaAId?: string;
  asignadaA?: string;

  totalEventos: number;
  ultimaActualizacion?: string;
}

export interface ApiResponse {
  message: string;
}

export interface ExpedienteNovedadResponse {
  novedadId: string;

  nombreConjunto: string;

  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;

  reportadaPor: string;
  responsable: string;

  fechaApertura: string;
  fechaCierre?: string | null;
  fechaGeneracion: string;

  eventos: EventoNovedad[];
}

@Injectable({
  providedIn: 'root',
})

export class NovedadService {

  private readonly baseUrl = 'https://localhost:7232/api/novedad';

  constructor(private readonly http: HttpClient) {}

  crearNovedad(request: CrearNovedadRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/crear`,
      request
    );
  }

  obtener(): Observable<NovedadResponse[]> {
    return this.http.get<NovedadResponse[]>(
      `${this.baseUrl}/obtener`
    );
  }

  obtenerMisAsignadas(): Observable<NovedadResponse[]> {
    return this.http.get<NovedadResponse[]>(
      `${this.baseUrl}/mis-asignadas`
    );
  }

  asignar(request: AsignarNovedadRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.baseUrl}/asignar`,
      request
    );
  }

  agregarEvento(request: CrearEventoRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/agregar-evento`,
      request
    );
  }

  cerrarNovedad(request: CerrarNovedadRequest): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/cerrar`,
      request
    );
  }

  obtenerEventos(novedadId: string): Observable<EventoNovedad[]> {
    return this.http.get<EventoNovedad[]>(
      `${this.baseUrl}/${novedadId}/eventos`
    );
  }

  obtenerExpediente(
    novedadId: string
  ): Observable<ExpedienteNovedadResponse> {
    return this.http.get<ExpedienteNovedadResponse>(
      `${this.baseUrl}/${novedadId}/expediente`
    );
  }

}