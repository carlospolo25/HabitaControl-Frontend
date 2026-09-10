import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../config/api.config';

export interface RegistrarReservaZonaComunRequest {
  zonaComunId: string;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  cantidadPersonas: number;
  observacion: string | null;
}

export interface CancelarReservaZonaComunRequest {
  motivo: string;
}

export interface RevisarReservaZonaComunRequest {
  aprobar: boolean;
  observacion: string | null;
}

export interface HorarioOcupadoZonaComunResponse {
  horaInicio: string;
  horaFin: string;
}

export interface ReservaZonaComunResponse {
  id: string;

  zonaComunId: string;
  zonaComunNombre: string;

  residenteId: string;
  residenteNombre: string;

  fechaReserva: string;
  horaInicio: string;
  horaFin: string;

  cantidadPersonas: number;

  estado: string;

  observacion: string | null;

  fechaCreacion: string;
  fechaActualizacion: string | null;

  fechaCancelacion: string | null;
  canceladaPorId: string | null;
  motivoCancelacion: string | null;

  observacionRevision: string | null;
  fechaRevision: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ReservaZonaComunService {
  private readonly apiUrl =
    `${API_CONFIG.baseUrl}/ReservaZonaComun`;

  constructor(
    private readonly http: HttpClient,
  ) {}

  registrar(
    request: RegistrarReservaZonaComunRequest,
  ): Observable<ReservaZonaComunResponse> {
    return this.http.post<ReservaZonaComunResponse>(
      `${this.apiUrl}/registrar`,
      request,
    );
  }

  obtenerMisReservas(): Observable<ReservaZonaComunResponse[]> {
    return this.http.get<ReservaZonaComunResponse[]>(
      `${this.apiUrl}/mis-reservas`,
    );
  }

  obtenerPorId(
    reservaId: string,
  ): Observable<ReservaZonaComunResponse> {
    return this.http.get<ReservaZonaComunResponse>(
      `${this.apiUrl}/obtener/${reservaId}`,
    );
  }

  cancelar(
    reservaId: string,
    request: CancelarReservaZonaComunRequest,
  ): Observable<ReservaZonaComunResponse> {
    return this.http.put<ReservaZonaComunResponse>(
      `${this.apiUrl}/cancelar/${reservaId}`,
      request,
    );
  }

  obtenerHorariosOcupados(
    zonaComunId: string,
    fecha: string,
  ): Observable<HorarioOcupadoZonaComunResponse[]> {
    return this.http.get<HorarioOcupadoZonaComunResponse[]>(
      `${this.apiUrl}/zona/${zonaComunId}/fecha/${fecha}`,
    );
  }

  revisar(
    reservaId: string,
    request: RevisarReservaZonaComunRequest,
  ): Observable<ReservaZonaComunResponse> {
    return this.http.put<ReservaZonaComunResponse>(
      `${this.apiUrl}/revisar/${reservaId}`,
      request,
    );
  }

  obtenerTodas(): Observable<ReservaZonaComunResponse[]> {
    return this.http.get<ReservaZonaComunResponse[]>(
      `${this.apiUrl}/obtener`,
    );
  }
}