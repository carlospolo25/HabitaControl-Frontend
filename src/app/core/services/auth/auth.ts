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
    return this.http.post<AuthResult>(`${this.baseUrl}/auth/login`, data);
  }

  register(data: RegisterRequest): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/auth/register`,
      data
    );
  }

  refreshToken(): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.baseUrl}/auth/refresh`, {
      accessToken: this.getAccessToken() ?? '',
      refreshToken: this.getRefreshToken() ?? '',
    });
  }

  logout(): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.baseUrl}/auth/logout`, {
      refreshToken: this.getRefreshToken() ?? '',
    });
  }

  saveTokens(tokens: AuthResult): void {
    localStorage.setItem(this.accessTokenKey, tokens.accessToken);
    localStorage.setItem(this.refreshTokenKey, tokens.refreshToken);
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
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }
}