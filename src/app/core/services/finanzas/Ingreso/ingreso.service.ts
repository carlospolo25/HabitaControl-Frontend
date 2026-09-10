import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../config/api.config';

export enum EstadoIngreso {
  Pendiente = 1,
  Pagado = 2,
  Anulado = 3,
}

export interface IngresoResponse {
  id: string;

  categoriaIngresoId: string;
  categoriaIngresoNombre: string;

  concepto: string;
  descripcion: string | null;

  valor: number;
  fechaIngreso: string;

  estado: string;
  metodoPago: string | null;
  referencia: string | null;

  observacion: string | null;

  registradoPorId: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;

  fechaAnulacion: string | null;
  anuladoPorId: string | null;
  motivoAnulacion: string | null;
}

export interface RegistrarIngresoRequest {
  categoriaIngresoId: string;

  concepto: string;
  descripcion?: string | null;

  valor: number;
  fechaIngreso: string;

  estado: EstadoIngreso;
  metodoPago?: string | null;
  referencia?: string | null;

  observacion?: string | null;
}

export interface ActualizarIngresoRequest {
  categoriaIngresoId: string;

  concepto: string;
  descripcion?: string | null;

  valor: number;
  fechaIngreso: string;

  estado: EstadoIngreso;
  metodoPago?: string | null;
  referencia?: string | null;

  observacion?: string | null;
}

export interface AnularIngresoRequest {
  motivo: string;
}

@Injectable({
  providedIn: 'root',
})
export class IngresoService {
  private readonly apiUrl =
    `${API_CONFIG.baseUrl}/Ingreso`;

  constructor(private readonly http: HttpClient) {}

  obtener(): Observable<IngresoResponse[]> {
    return this.http.get<IngresoResponse[]>(
      `${this.apiUrl}/obtener`
    );
  }

  obtenerPorMes(
    mes: number,
    anio: number
  ): Observable<IngresoResponse[]> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());

    return this.http.get<IngresoResponse[]>(
      `${this.apiUrl}/por-mes`,
      { params }
    );
  }

  obtenerPorRango(
    fechaDesde: string,
    fechaHasta: string
  ): Observable<IngresoResponse[]> {
    const params = new HttpParams()
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta);

    return this.http.get<IngresoResponse[]>(
      `${this.apiUrl}/por-rango`,
      { params }
    );
  }

  obtenerPorId(id: string): Observable<IngresoResponse> {
    return this.http.get<IngresoResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  registrar(
    request: RegistrarIngresoRequest
  ): Observable<IngresoResponse> {
    return this.http.post<IngresoResponse>(
      `${this.apiUrl}/registrar`,
      request
    );
  }

  actualizar(
    id: string,
    request: ActualizarIngresoRequest
  ): Observable<IngresoResponse> {
    return this.http.put<IngresoResponse>(
      `${this.apiUrl}/actualizar/${id}`,
      request
    );
  }

  anular(
    id: string,
    motivo: string
  ): Observable<IngresoResponse> {
    const request: AnularIngresoRequest = {
      motivo,
    };

    return this.http.patch<IngresoResponse>(
      `${this.apiUrl}/anular/${id}`,
      request
    );
  }
}