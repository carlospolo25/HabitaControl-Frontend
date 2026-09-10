import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../config/api.config';

// ======================================================
// ENUMS
// ======================================================

export enum ClaseNovedad {
  Novedad = 1,
  Tarea = 2,
}

export enum PrioridadTarea {
  Baja = 1,
  Media = 2,
  Alta = 3,
  Critica = 4,
}

// ======================================================
// REQUESTS
// ======================================================

export interface CrearNovedadRequest {
  titulo: string;
  tipo: string;
  descripcion: string;

  clase: ClaseNovedad;

  prioridad?: PrioridadTarea | null;
  fechaLimite?: string | null;

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

// ======================================================
// RESPONSES
// ======================================================

export interface EventoNovedad {
  id: string;
  novedadId: string;

  tipo: string;
  comentario: string;

  imagenUrl?: string | null;

  registradoPor: string;
  fechaCreacion: string;
}

export interface NovedadResponse {
  id: string;

  titulo: string;
  descripcion: string;

  tipo: string;
  estado: string;

  clase: ClaseNovedad;

  prioridad?: PrioridadTarea | null;
  fechaLimite?: string | null;

  fechaCreacion: string;

  reportadaPorId: string;
  reportadaPor: string;

  asignadaAId?: string | null;
  asignadaA?: string | null;

  totalEventos: number;

  ultimaActualizacion?: string | null;
}

export interface ExpedienteNovedadResponse {
  novedadId: string;

  nombreConjunto: string;

  titulo: string;
  descripcion: string;

  tipo: string;
  estado: string;

  clase: ClaseNovedad;

  prioridad?: PrioridadTarea | null;
  fechaLimite?: string | null;

  reportadaPor: string;
  responsable: string;

  fechaApertura: string;
  fechaCierre?: string | null;

  fechaGeneracion: string;

  eventos: EventoNovedad[];
}

// ======================================================
// RESPUESTAS SIMPLES API
// ======================================================

export interface ApiMensajeResponse {
  mensaje: string;
}

export interface ApiMessageResponse {
  message: string;
}

// ======================================================
// SERVICE
// ======================================================

@Injectable({
  providedIn: 'root',
})
export class NovedadService {

  private readonly baseUrl =
    `${API_CONFIG.baseUrl}/novedad`;

  constructor(
    private readonly http: HttpClient
  ) {}

  // ====================================================
  // CREAR NOVEDAD / TAREA
  // ====================================================

  crearNovedad(
    request: CrearNovedadRequest
  ): Observable<ApiMensajeResponse> {

    return this.http.post<ApiMensajeResponse>(
      `${this.baseUrl}/crear`,
      request
    );
  }

  // ====================================================
  // OBTENER
  // ====================================================

  obtener(): Observable<NovedadResponse[]> {

    return this.http.get<NovedadResponse[]>(
      `${this.baseUrl}/obtener`
    );
  }

  // ====================================================
  // MIS ASIGNADAS
  // ====================================================

  obtenerMisAsignadas(): Observable<NovedadResponse[]> {

    return this.http.get<NovedadResponse[]>(
      `${this.baseUrl}/mis-asignadas`
    );
  }

  // ====================================================
  // ASIGNAR
  // ====================================================

  asignar(
    request: AsignarNovedadRequest
  ): Observable<ApiMessageResponse> {

    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/asignar`,
      request
    );
  }

  // ====================================================
  // SEGUIMIENTO
  // ====================================================

  agregarEvento(
    request: CrearEventoRequest
  ): Observable<ApiMensajeResponse> {

    return this.http.post<ApiMensajeResponse>(
      `${this.baseUrl}/agregar-evento`,
      request
    );
  }

  // ====================================================
  // CERRAR / FINALIZAR
  // ====================================================

  cerrarNovedad(
    request: CerrarNovedadRequest
  ): Observable<ApiMensajeResponse> {

    return this.http.post<ApiMensajeResponse>(
      `${this.baseUrl}/cerrar`,
      request
    );
  }

  // ====================================================
  // EVENTOS
  // ====================================================

  obtenerEventos(
    novedadId: string
  ): Observable<EventoNovedad[]> {

    return this.http.get<EventoNovedad[]>(
      `${this.baseUrl}/${novedadId}/eventos`
    );
  }

  // ====================================================
  // EVIDENCIA DE EVENTO
  // ====================================================

  obtenerImagenEventoUrl(
    novedadId: string,
    eventoId: string
  ): string {

    if (!novedadId?.trim() || !eventoId?.trim()) {
      return '';
    }

    return `${this.baseUrl}/${novedadId}/eventos/${eventoId}/imagen`;
  }

  // ====================================================
  // EXPEDIENTE
  // ====================================================

  obtenerExpediente(
    novedadId: string
  ): Observable<ExpedienteNovedadResponse> {

    return this.http.get<ExpedienteNovedadResponse>(
      `${this.baseUrl}/${novedadId}/expediente`
    );
  }
}