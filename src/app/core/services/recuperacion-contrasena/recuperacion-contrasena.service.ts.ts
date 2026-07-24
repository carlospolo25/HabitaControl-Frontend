import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/* =========================================================
   REQUESTS
   ========================================================= */

export interface SolicitarRecuperacionContrasenaRequest {
  email: string;
}

export interface RestablecerContrasenaRequest {
  token: string;
  nuevaContrasena: string;
  confirmarContrasena: string;
}

export interface CancelarRecuperacionContrasenaRequest {
  token: string;
}

/* =========================================================
   RESPONSES
   ========================================================= */

export interface RecuperacionContrasenaResponse {
  exitoso: boolean;
  mensaje: string;
}

export interface ValidarRecuperacionContrasenaResponse {
  valido: boolean;
  mensaje: string;
  fechaExpiracion: string | null;
}

/* =========================================================
   SERVICE
   ========================================================= */

@Injectable({
  providedIn: 'root',
})
export class RecuperacionContrasenaService {
  private readonly apiUrl =
    'https://localhost:7232/api/RecuperarContrasena';

  constructor(private readonly http: HttpClient) {}

  solicitar(
    request: SolicitarRecuperacionContrasenaRequest
  ): Observable<RecuperacionContrasenaResponse> {
    return this.http.post<RecuperacionContrasenaResponse>(
      `${this.apiUrl}/solicitar`,
      request
    );
  }

  validarToken(
    token: string
  ): Observable<ValidarRecuperacionContrasenaResponse> {
    const tokenCodificado = encodeURIComponent(token);

    return this.http.get<ValidarRecuperacionContrasenaResponse>(
      `${this.apiUrl}/validar/${tokenCodificado}`
    );
  }

  restablecer(
    request: RestablecerContrasenaRequest
  ): Observable<RecuperacionContrasenaResponse> {
    return this.http.post<RecuperacionContrasenaResponse>(
      `${this.apiUrl}/restablecer`,
      request
    );
  }

  cancelar(
    request: CancelarRecuperacionContrasenaRequest
  ): Observable<RecuperacionContrasenaResponse> {
    return this.http.post<RecuperacionContrasenaResponse>(
      `${this.apiUrl}/cancelar`,
      request
    );
  }
}