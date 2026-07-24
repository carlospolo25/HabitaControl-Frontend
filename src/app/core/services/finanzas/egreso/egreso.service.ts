import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export enum EstadoEgreso {
  Registrado = 1,
  Pagado = 2,
  Anulado = 3,
}

export interface EgresoResponse {
  id: string;

  categoriaEgresoId: string;
  categoriaEgresoNombre: string;

  concepto: string;
  descripcion: string | null;

  valor: number;
  fechaEgreso: string;

  proveedor: string | null;
  numeroFactura: string | null;

  estado: string;
  observacion: string | null;

  registradoPorId: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;

  fechaAnulacion: string | null;
  anuladoPorId: string | null;
  motivoAnulacion: string | null;
}

export interface RegistrarEgresoRequest {
  categoriaEgresoId: string;

  concepto: string;
  descripcion?: string | null;

  valor: number;
  fechaEgreso: string;

  estado: EstadoEgreso;

  proveedor?: string | null;
  numeroFactura?: string | null;
  observacion?: string | null;
}

export interface ActualizarEgresoRequest {
  categoriaEgresoId: string;

  concepto: string;
  descripcion?: string | null;

  valor: number;
  fechaEgreso: string;

  estado: EstadoEgreso;

  proveedor?: string | null;
  numeroFactura?: string | null;
  observacion?: string | null;
}

export interface AnularEgresoRequest {
  motivo: string;
}

@Injectable({
  providedIn: 'root',
})
export class EgresoService {
  private readonly apiUrl =
    'https://localhost:7232/api/Egreso';

  constructor(private readonly http: HttpClient) {}

  obtener(): Observable<EgresoResponse[]> {
    return this.http.get<EgresoResponse[]>(
      `${this.apiUrl}/obtener`
    );
  }

  obtenerPorMes(
    mes: number,
    anio: number
  ): Observable<EgresoResponse[]> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());

    return this.http.get<EgresoResponse[]>(
      `${this.apiUrl}/por-mes`,
      { params }
    );
  }

  obtenerPorRango(
    fechaDesde: string,
    fechaHasta: string
  ): Observable<EgresoResponse[]> {
    const params = new HttpParams()
      .set('fechaDesde', fechaDesde)
      .set('fechaHasta', fechaHasta);

    return this.http.get<EgresoResponse[]>(
      `${this.apiUrl}/por-rango`,
      { params }
    );
  }

  obtenerPorId(id: string): Observable<EgresoResponse> {
    return this.http.get<EgresoResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  registrar(
    request: RegistrarEgresoRequest
  ): Observable<EgresoResponse> {
    return this.http.post<EgresoResponse>(
      `${this.apiUrl}/registrar`,
      request
    );
  }

  actualizar(
    id: string,
    request: ActualizarEgresoRequest
  ): Observable<EgresoResponse> {
    return this.http.put<EgresoResponse>(
      `${this.apiUrl}/actualizar/${id}`,
      request
    );
  }

  anular(
    id: string,
    motivo: string
  ): Observable<EgresoResponse> {
    const request: AnularEgresoRequest = {
      motivo,
    };

    return this.http.patch<EgresoResponse>(
      `${this.apiUrl}/anular/${id}`,
      request
    );
  }
}