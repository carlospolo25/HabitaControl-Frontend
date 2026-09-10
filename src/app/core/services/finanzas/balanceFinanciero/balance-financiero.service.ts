import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../config/api.config';

export type TipoPeriodoFinanciero =
  | 'mensual'
  | 'trimestral'
  | 'semestral'
  | 'anual';

export interface BalanceFinancieroResponse {
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
}

export interface ConsultarBalanceFinancieroParams {
  anio: number;
  tipoPeriodo: TipoPeriodoFinanciero;

  mes?: number | null;
  trimestre?: number | null;
  semestre?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class BalanceFinancieroService {
  private readonly apiUrl =
    `${API_CONFIG.baseUrl}/BalanceFinanciero`;

  constructor(private readonly http: HttpClient) {}

  obtenerBalance(
    filtros: ConsultarBalanceFinancieroParams
  ): Observable<BalanceFinancieroResponse> {
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

    return this.http.get<BalanceFinancieroResponse>(
      `${this.apiUrl}/obtener`,
      { params }
    );
  }
}