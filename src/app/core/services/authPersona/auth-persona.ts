import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../config/api.config';

import {
  HttpClient,
  HttpContext,
} from '@angular/common/http';

import {
  SKIP_AUTH_REFRESH,
} from '../../Auth/auth-http-context';

export interface LoginPersonaRequest {
  email: string;
  password: string;
}

export interface ApiMessageResponse {
  message: string;
}

export interface PersonaSessionResponse {
  authenticated: boolean;
  identityType: string;
  personaId: string;
  tenantId: string;
  tipo: string;
}

export interface CompletePersonRegistrationRequest {
  token: string;

  name: string;
  document: string;
  phone: string;
  email: string;
  password: string;

  tower: string;
  apartment: string;
  relationship: string;

  birthDate: string | null;

  emergencyContactName: string;
  emergencyContactPhone: string;

  jobTitle: string;
  contractorCompany: string;

  receivesNotifications: boolean;

  notes: string;

  aceptaPoliticasPrivacidad: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthPersona {
  private readonly baseUrl = API_CONFIG.baseUrl;

  constructor(
    private readonly http: HttpClient
  ) {}

  registro(data: unknown) {
    return this.http.post(
      `${this.baseUrl}/auth/registro`,
      data
    );
  }

  validarInvitacion(token: string) {
    return this.http.get(
      `${this.baseUrl}/RegisterPerson/validate-invitation?token=${token}`
    );
  }

  completarRegistro(
    data: CompletePersonRegistrationRequest
  ): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/RegisterPerson/complete-registration`,
      data
    );
  }

  loginPersona(
    data: LoginPersonaRequest
  ): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/authPersona/login-persona`,
      data
    );
  }

  refreshTokenPersona():
    Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/authPersona/refresh`,
      {}
    );
  }

  logoutPersona():
    Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/authPersona/logout`,
      {}
    );
  }

  comprobarSesion():
    Observable<PersonaSessionResponse> {

    const context =
      new HttpContext()
        .set(
          SKIP_AUTH_REFRESH,
          true
        );

    return this.http.get<PersonaSessionResponse>(
      `${this.baseUrl}/authPersona/session`,
      {
        context,
      }
    );
  }
}