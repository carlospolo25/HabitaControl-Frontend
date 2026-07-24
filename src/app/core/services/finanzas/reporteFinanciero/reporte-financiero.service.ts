import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type TipoPeriodoFinanciero =
  | 'mensual'
  | 'trimestral'
  | 'semestral'
  | 'anual';

export interface DetalleCategoriaFinancieraResponse {
  categoriaId: string;
  categoriaNombre: string;
  total: number;
  cantidadMovimientos: number;
  porcentajeTotal: number;
}

export interface MovimientoFinancieroResponse {
  id: string;

  fecha: string;

  categoriaId: string;
  categoriaNombre: string;

  tipoMovimiento: string;

  concepto: string;
  descripcion: string | null;

  valor: number;

  estado: string;

  tercero: string | null;
  referencia: string | null;
  observacion: string | null;
}

export interface ReporteFinancieroResponse {
  anio: number;

  mes: number | null;
  trimestre: number | null;
  semestre: number | null;

  tipoPeriodo: TipoPeriodoFinanciero;
  periodoTexto: string;

  fechaInicio: string;
  fechaFin: string;

  totalIngresos: number;
  totalEgresos: number;
  saldoDisponible: number;

  saldoPositivo: boolean;

  cantidadIngresos: number;
  cantidadEgresos: number;

  ingresosPorCategoria: DetalleCategoriaFinancieraResponse[];
  egresosPorCategoria: DetalleCategoriaFinancieraResponse[];

  ingresosDetalle: MovimientoFinancieroResponse[];
  egresosDetalle: MovimientoFinancieroResponse[];
}

export interface ConsultarReporteFinancieroParams {
  anio: number;
  tipoPeriodo: TipoPeriodoFinanciero;

  mes?: number | null;
  trimestre?: number | null;
  semestre?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ReporteFinancieroService {
  private readonly apiUrl =
    'https://localhost:7232/api/ReporteFinanciero';

  constructor(private readonly http: HttpClient) {}

  obtenerReporteMensual(
    mes: number,
    anio: number
  ): Observable<ReporteFinancieroResponse> {
    const params = new HttpParams()
      .set('mes', mes.toString())
      .set('anio', anio.toString());

    return this.http.get<ReporteFinancieroResponse>(
      `${this.apiUrl}/mensual`,
      { params }
    );
  }

  obtenerReporte(
    filtros: ConsultarReporteFinancieroParams
  ): Observable<ReporteFinancieroResponse> {
    let params = new HttpParams()
      .set('anio', filtros.anio.toString())
      .set('tipoPeriodo', filtros.tipoPeriodo);

    if (
      filtros.tipoPeriodo === 'mensual' &&
      filtros.mes != null
    ) {
      params = params.set('mes', filtros.mes.toString());
    }

    if (
      filtros.tipoPeriodo === 'trimestral' &&
      filtros.trimestre != null
    ) {
      params = params.set(
        'trimestre',
        filtros.trimestre.toString()
      );
    }

    if (
      filtros.tipoPeriodo === 'semestral' &&
      filtros.semestre != null
    ) {
      params = params.set(
        'semestre',
        filtros.semestre.toString()
      );
    }

    return this.http.get<ReporteFinancieroResponse>(
      `${this.apiUrl}/obtener`,
      { params }
    );
  }
}