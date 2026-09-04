import {
  HttpBackend,
  HttpClient,
} from '@angular/common/http';

import { Injectable } from '@angular/core';

import {
  Observable,
  finalize,
  map,
  of,
  shareReplay,
  tap,
} from 'rxjs';

import {
  API_CONFIG,
} from '../../config/api.config';

interface CsrfTokenResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class CsrfService {

  private readonly baseUrl =
    API_CONFIG.baseUrl;

  /*
   * HttpClient independiente.
   *
   * Usa HttpBackend directamente para que
   * GET /Csrf/token no atraviese nuestros
   * interceptores.
   */
  private readonly http: HttpClient;

  /*
   * El RequestToken CSRF se mantiene
   * únicamente en memoria.
   */
  private csrfToken: string | null =
    null;

  /*
   * Evita solicitar varios tokens CSRF
   * simultáneamente.
   */
  private tokenRequest$:
    Observable<string> | null =
      null;

  constructor(
    httpBackend: HttpBackend
  ) {
    this.http =
      new HttpClient(httpBackend);
  }

  obtenerToken(): Observable<string> {

    /*
     * Si ya tenemos token en memoria,
     * lo reutilizamos.
     */
    if (this.csrfToken) {
      return of(this.csrfToken);
    }

    /*
     * Si ya hay una solicitud en curso,
     * las demás esperan la misma.
     */
    if (this.tokenRequest$) {
      return this.tokenRequest$;
    }

    this.tokenRequest$ =
      this.http
        .get<CsrfTokenResponse>(
          `${this.baseUrl}/Csrf/token`,
          {
            withCredentials: true,
          }
        )
        .pipe(
          map((response) => {
            const token =
              response?.token?.trim();

            if (!token) {
              throw new Error(
                'El servidor no proporcionó un token CSRF válido.'
              );
            }

            return token;
          }),

          tap((token) => {
            this.csrfToken =
              token;
          }),

          finalize(() => {
            this.tokenRequest$ =
              null;
          }),

          shareReplay({
            bufferSize: 1,
            refCount: false,
          })
        );

    return this.tokenRequest$;
  }

  limpiarToken(): void {
    this.csrfToken = null;
  }
}