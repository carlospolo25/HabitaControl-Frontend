import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { API_CONFIG } from '../../config/api.config';

export interface CerrarSesionesAlertaRequest {
  token: string;
}

export interface CerrarSesionesAlertaResponse {
  exitoso: boolean;
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class SeguridadService {
  private readonly api =
    `${API_CONFIG.baseUrl}/Seguridad`;

  constructor(
    private readonly http: HttpClient
  ) {}

  cerrarTodasLasSesiones(
    token: string
  ): Observable<CerrarSesionesAlertaResponse> {
    const request: CerrarSesionesAlertaRequest = {
      token: token.trim(),
    };

    return this.http.post<CerrarSesionesAlertaResponse>(
      `${this.api}/cerrar-sesiones`,
      request
    );
  }
}