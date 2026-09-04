import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_CONFIG } from '../../config/api.config';

import {
  SKIP_AUTH_REFRESH,
} from '../../Auth/auth-http-context';

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

export interface ConfirmarPasswordUsuarioRequest {
  password: string;
}

export interface PerfilUsuarioResponse {
  usuarioId: string;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  fotoUrl: string | null;
  fechaCreacionUsuario: string;
  fechaActualizacionUsuario: string | null;

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
  nombre: string;
  documento: string;
  telefono: string;
  email: string;

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

  foto?: File | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = API_CONFIG.baseUrl;

  constructor(private readonly http: HttpClient) {}

  login(
    data: LoginRequest
  ): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/auth/login`,
      data
    );
  }

  register(
    data: RegisterRequest
  ): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/auth/register`,
      data
    );
  }

  refreshToken():
    Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/auth/refresh`,
      {}
    );
  }

  logout(): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/auth/logout`,
      {}
    );
  }

  obtenerPerfil(): Observable<PerfilUsuarioResponse> {
    return this.http.get<PerfilUsuarioResponse>(
      `${this.baseUrl}/auth/mi-perfil`
    );
  }

  actualizarPerfil(
    request: ActualizarPerfilUsuarioRequest
  ): Observable<PerfilUsuarioResponse> {
    const formData =
      this.construirPerfilFormData(request);

    return this.http.put<PerfilUsuarioResponse>(
      `${this.baseUrl}/auth/actualizar-perfil`,
      formData
    );
  }

  confirmarPassword(
    request: ConfirmarPasswordUsuarioRequest
  ): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/auth/confirmar-password`,
      request
    );
  }

  eliminarMiCuenta():
    Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(
      `${this.baseUrl}/auth/eliminar-cuenta`
    );
  }

  private construirPerfilFormData(
    request: ActualizarPerfilUsuarioRequest
  ): FormData {
    const formData = new FormData();

    formData.append(
      'nombreUsuario',
      request.nombre.trim()
    );

    formData.append(
      'documentoUsuario',
      request.documento.trim()
    );

    formData.append(
      'telefonoUsuario',
      request.telefono.trim()
    );

    formData.append(
      'emailUsuario',
      request.email.trim()
    );

    formData.append(
      'nombreEmpresa',
      request.nombreEmpresa.trim()
    );

    formData.append(
      'nit',
      request.nit.trim()
    );

    formData.append(
      'dominio',
      request.dominio.trim()
    );

    formData.append(
      'direccion',
      request.direccion.trim()
    );

    formData.append(
      'ciudad',
      request.ciudad.trim()
    );

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

    if (
      request.cantidadApartamentos !== null
    ) {
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

  comprobarSesion():
    Observable<PerfilUsuarioResponse> {
    return this.http.get<PerfilUsuarioResponse>(
      `${this.baseUrl}/auth/mi-perfil`,
      {
        context:
          new HttpContext().set(
            SKIP_AUTH_REFRESH,
            true
          ),
      }
    );
  }
}