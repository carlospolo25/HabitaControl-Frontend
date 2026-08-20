import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistrarVisitanteRequest {
  nombre: string;
  documento: string;
  torre: string;
  apartamento: string;
  autorizadoPorNombre: string;

  emailVisitante?: string;
  telefonoVisitante?: string;

  foto?: File | null;
}

export interface VisitanteResponse {
  id: string;
  nombre: string;
  documento: string;
  torre: string;
  apartamento: string;
  autorizadoPorNombre: string;
  estado: string;
  fechaIngreso: string;
  fechaSalida?: string | null;
  fotoUrl?: string | null;
}

export interface CrearInvitacionVisitanteRequest {
  nombre: string;
  documento: string;
  torre: string;
  apartamento: string;
  emailVisitante: string;
  telefonoVisitante?: string;
}

export interface InvitacionVisitanteResponse {
  id: string;
  token: string;
  qrBase64: string;
  fechaCreacion: string;
  fechaExpiracion: string;
  usada: boolean;
  expirada: boolean;
}

export interface ValidarInvitacionVisitanteResponse {
  puedeIngresar: boolean;
  mensaje: string;
  visitante: RegistrarVisitanteRequest | null;
}

export interface ApiMessageResponse {
  mensaje: string;
}

@Injectable({
  providedIn: 'root',
})
export class VisitanteService {
  private readonly baseUrl =
    'https://localhost:7232/api/Visitante';

  constructor(
    private readonly http: HttpClient
  ) {}

  crearVisitante(
    data: RegistrarVisitanteRequest
  ): Observable<ApiMessageResponse> {
    const formData = new FormData();

    formData.append(
      'Nombre',
      data.nombre
    );

    formData.append(
      'Documento',
      data.documento
    );

    formData.append(
      'Torre',
      data.torre
    );

    formData.append(
      'Apartamento',
      data.apartamento
    );

    formData.append(
      'AutorizadoPorNombre',
      data.autorizadoPorNombre
    );

    if (data.emailVisitante) {
      formData.append(
        'EmailVisitante',
        data.emailVisitante
      );
    }

    if (data.telefonoVisitante) {
      formData.append(
        'TelefonoVisitante',
        data.telefonoVisitante
      );
    }

    if (data.foto) {
      formData.append(
        'Foto',
        data.foto,
        data.foto.name
      );
    }

    return this.http.post<ApiMessageResponse>(
      `${this.baseUrl}/registrar`,
      formData
    );
  }

  obtener(): Observable<VisitanteResponse[]> {
    return this.http.get<VisitanteResponse[]>(
      `${this.baseUrl}/obtener`
    );
  }

  darSalida(
    id: string
  ): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(
      `${this.baseUrl}/salida/${id}`,
      {}
    );
  }

  crearInvitacion(
    request: CrearInvitacionVisitanteRequest
  ): Observable<InvitacionVisitanteResponse> {
    return this.http.post<InvitacionVisitanteResponse>(
      `${this.baseUrl}/crear-invitacion`,
      request
    );
  }

  validarInvitacion(
    token: string
  ): Observable<ValidarInvitacionVisitanteResponse> {
    return this.http.get<ValidarInvitacionVisitanteResponse>(
      `${this.baseUrl}/validar-invitacion/${token}`
    );
  }

  marcarInvitacionComoUsada(
    token: string
  ): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(
      `${this.baseUrl}/marcar-invitacion-usada/${token}`,
      {}
    );
  }
}