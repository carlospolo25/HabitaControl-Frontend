import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../config/api.config';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombreEmpresa: string;
  dominio: string;
  nit: string;
  direccion: string;
  ciudad: string;
  telefonoEmpresa: string;
  emailContacto: string;
  tipoPropiedad: string;
  cantidadTorres: number | null;
  cantidadApartamentos: number | null;

  adminNombre: string;
  adminDocumento: string;
  adminTelefono: string;
  adminEmail: string;
  adminPassword: string;
}

export interface ApiMessageResponse {
  message: string;
}

/* =========================================================
   PERFIL DEL ADMINISTRADOR
   ========================================================= */

export interface PerfilUsuarioResponse {
  // Usuario administrador
  usuarioId: string;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  fotoUrl: string | null;
  fechaCreacionUsuario: string;
  fechaActualizacionUsuario: string | null;

  // Tenant / residencia
  tenantId: string;
  nombreEmpresa: string;
  nit: string;
  dominio: string;
  direccion: string;
  ciudad: string;
  telefonoEmpresa: string;
  emailContacto: string;
  tipoPropiedad: string;
  cantidadTorres: number | null;
  cantidadApartamentos: number | null;
  fechaCreacionTenant: string;
  fechaActualizacionTenant: string | null;
}

export interface ActualizarPerfilUsuarioRequest {
  // Usuario administrador
  nombre: string;
  documento: string;
  telefono: string;
  email: string;

  // Tenant / residencia
  nombreEmpresa: string;
  nit: string;
  dominio: string;
  direccion: string;
  ciudad: string;
  telefonoEmpresa: string;
  emailContacto: string;
  tipoPropiedad: string;
  cantidadTorres: number | null;
  cantidadApartamentos: number | null;

  // Archivo opcional
  foto?: File | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = API_CONFIG.baseUrl;

  private readonly accessTokenKey = 'accessToken';
  private readonly refreshTokenKey = 'refreshToken';
  private readonly legacyTokenKey = 'token';

  constructor(private http: HttpClient) {}

  login(data: LoginRequest): Observable<AuthResult> {
    return this.http.post<AuthResult>(
      `${this.baseUrl}/auth/login`,
      data
    );
  }

  register(data: RegisterRequest): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/auth/register`,
      data
    );
  }

  refreshToken(): Observable<AuthResult> {
    return this.http.post<AuthResult>(
      `${this.baseUrl}/auth/refresh`,
      {
        accessToken: this.getAccessToken() ?? '',
        refreshToken: this.getRefreshToken() ?? '',
      }
    );
  }

  logout(): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/auth/logout`,
      {
        refreshToken: this.getRefreshToken() ?? '',
      }
    );
  }

  /* =========================================================
     PERFIL DEL ADMINISTRADOR
     ========================================================= */

  obtenerPerfil(): Observable<PerfilUsuarioResponse> {
    return this.http.get<PerfilUsuarioResponse>(
      `${this.baseUrl}/auth/mi-perfil`
    );
  }

  actualizarPerfil(
    request: ActualizarPerfilUsuarioRequest
  ): Observable<PerfilUsuarioResponse> {
    const formData = this.construirPerfilFormData(request);

    return this.http.put<PerfilUsuarioResponse>(
      `${this.baseUrl}/auth/actualizar-perfil`,
      formData
    );
  }

  private construirPerfilFormData(
    request: ActualizarPerfilUsuarioRequest
  ): FormData {
    const formData = new FormData();

    // Datos del administrador
    formData.append('nombreUsuario', request.nombre.trim());
    formData.append('documentoUsuario', request.documento.trim());
    formData.append('telefonoUsuario', request.telefono.trim());
    formData.append('emailUsuario', request.email.trim());

    // Datos del Tenant
    formData.append('nombreEmpresa', request.nombreEmpresa.trim());
    formData.append('nit', request.nit.trim());
    formData.append('dominio', request.dominio.trim());
    formData.append('direccion', request.direccion.trim());
    formData.append('ciudad', request.ciudad.trim());

    formData.append(
      'telefonoEmpresa',
      request.telefonoEmpresa.trim()
    );

    formData.append(
      'emailContacto',
      request.emailContacto.trim()
    );

    formData.append(
      'tipoPropiedad',
      request.tipoPropiedad.trim()
    );

    if (request.cantidadTorres !== null) {
      formData.append(
        'cantidadTorres',
        request.cantidadTorres.toString()
      );
    }

    if (request.cantidadApartamentos !== null) {
      formData.append(
        'cantidadApartamentos',
        request.cantidadApartamentos.toString()
      );
    }

    if (request.foto) {
      formData.append(
        'foto',
        request.foto,
        request.foto.name
      );
    }

    return formData;
  }

  /* =========================================================
     SESIÓN Y TOKENS
     ========================================================= */

  saveTokens(tokens: AuthResult): void {
    localStorage.setItem(
      this.accessTokenKey,
      tokens.accessToken
    );

    localStorage.setItem(
      this.refreshTokenKey,
      tokens.refreshToken
    );

    localStorage.removeItem(this.legacyTokenKey);
  }

  guardarTokens(tokens: AuthResult): void {
    this.saveTokens(tokens);
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.legacyTokenKey);
  }

  limpiarSesion(): void {
    this.clearSession();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  isAuthenticated(): boolean {
    return (
      !!this.getAccessToken() &&
      !!this.getRefreshToken()
    );
  }
}