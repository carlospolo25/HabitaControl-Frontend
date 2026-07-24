import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegistrarVisitanteRequest {
  nombre: string;
  documento: string;
  torre: string;
  apartamento: string;
  autorizadoPorNombre: string;
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

export interface ApiMessageResponse{
    message:string;
}

@Injectable({
  providedIn: 'root',
})
export class VisitanteService {
  private readonly baseUrl = 'https://localhost:7232/api/Visitante';

  constructor(private readonly http: HttpClient) {}

  crearVisitante(data: RegistrarVisitanteRequest): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(`${this.baseUrl}/registrar`, data);
  }

  obtener(): Observable<VisitanteResponse[]> {
    return this.http.get<VisitanteResponse[]>(`${this.baseUrl}/obtener`);
  }

  darSalida(id: string): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(`${this.baseUrl}/salida/${id}`, {});
  }

  crearInvitacion(request: CrearInvitacionVisitanteRequest): Observable<InvitacionVisitanteResponse> {
    return this.http.post<InvitacionVisitanteResponse>(
        `${this.baseUrl}/crear-invitacion`,
        request
    );
  }

  validarInvitacion(token: string): Observable<ValidarInvitacionVisitanteResponse> {
    return this.http.get<ValidarInvitacionVisitanteResponse>(
      `${this.baseUrl}/validar-invitacion/${token}`
    );
  }

  marcarInvitacionComoUsada(token: string): Observable<ApiMessageResponse> {
    return this.http.put<ApiMessageResponse>(
        `${this.baseUrl}/marcar-invitacion-usada/${token}`,
        {}
    );
  }
}