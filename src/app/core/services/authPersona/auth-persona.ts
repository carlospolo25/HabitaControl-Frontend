import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { API_CONFIG } from '../../config/api.config';

export interface AuthPersonaResult {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPersonaRequest {
  email: string;
  password: string;
}

export interface RefreshPersonaRequest {
  refreshToken: string;
}

export interface LogoutPersonaRequest {
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthPersona {
  private readonly baseUrl = API_CONFIG.baseUrl;

  constructor(private readonly http: HttpClient) {}

  registro(data: unknown) {
    return this.http.post(`${this.baseUrl}/auth/registro`, data);
  }

  validarInvitacion(token: string) {
    return this.http.get(
      `${this.baseUrl}/RegisterPerson/validate-invitation?token=${token}`
    );
  }

  completarRegistro(data: unknown) {
    return this.http.post(
      `${this.baseUrl}/RegisterPerson/complete-registration`,
      data
    );
  }

  loginPersona(data: LoginPersonaRequest) {
    return this.http.post<AuthPersonaResult>(
      `${this.baseUrl}/authPersona/login-persona`,
      data
    );
  }

  refreshTokenPersona() {
    const request: RefreshPersonaRequest = {
      refreshToken: this.getPersonaRefreshToken() ?? '',
    };

    return this.http.post<AuthPersonaResult>(
      `${this.baseUrl}/authPersona/refresh`,
      request
    );
  }

  logoutPersona() {
    const request: LogoutPersonaRequest = {
      refreshToken: this.getPersonaRefreshToken() ?? '',
    };

    return this.http.post(
      `${this.baseUrl}/authPersona/logout`,
      request
    );
  }

  guardarTokensPersona(tokens: AuthPersonaResult): void {
    localStorage.setItem('personaAccessToken', tokens.accessToken);
    localStorage.setItem('personaRefreshToken', tokens.refreshToken);
  }

  limpiarSesionPersona(): void {
    localStorage.removeItem('personaAccessToken');
    localStorage.removeItem('personaRefreshToken');
    localStorage.removeItem('tokenPersona');
  }

  getPersonaAccessToken(): string | null {
    return localStorage.getItem('personaAccessToken');
  }

  getPersonaRefreshToken(): string | null {
    return localStorage.getItem('personaRefreshToken');
  }

  isPersonaLoggedIn(): boolean {
    return !!this.getPersonaAccessToken();
  }
}