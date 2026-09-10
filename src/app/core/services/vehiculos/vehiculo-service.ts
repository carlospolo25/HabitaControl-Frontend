import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../config/api.config';

export enum TipoVehiculo {
  Carro = 1,
  Moto = 2,
  NoMotorizado = 3,
}

export interface RegistrarVehiculoRequest {
  personaId: string;

  tipo: TipoVehiculo;

  placa: string;
  marca: string;
  color: string;
}

export interface ActualizarVehiculoRequest {
  tipo: TipoVehiculo;

  placa: string;
  marca: string;
  color: string;
}

export interface VehiculoResponse {
  id: string;

  personaId: string;

  tipo: TipoVehiculo;

  placa: string;
  marca: string;
  color: string;

  fotoUrl: string | null;

  activo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class VehiculoService {
  private readonly apiUrl =
    `${API_CONFIG.baseUrl}/Vehiculo`;

  constructor(
    private readonly http: HttpClient
  ) {}

  registrar(
    request: RegistrarVehiculoRequest,
    foto?: File | null
  ): Observable<VehiculoResponse> {
    const formData = this.crearFormDataRegistro(
      request,
      foto
    );

    return this.http.post<VehiculoResponse>(
      `${this.apiUrl}/registrar`,
      formData
    );
  }

  obtenerPorPersona(
    personaId: string
  ): Observable<VehiculoResponse[]> {
    return this.http.get<VehiculoResponse[]>(
      `${this.apiUrl}/persona/${personaId}`
    );
  }

  obtenerFotoUrl(
    vehiculoId: string
  ): string {
    return `${this.apiUrl}/${vehiculoId}/foto`;
  }

  actualizar(
    vehiculoId: string,
    request: ActualizarVehiculoRequest,
    foto?: File | null
  ): Observable<VehiculoResponse> {
    const formData = this.crearFormDataActualizacion(
      request,
      foto
    );

    return this.http.put<VehiculoResponse>(
      `${this.apiUrl}/actualizar/${vehiculoId}`,
      formData
    );
  }

  desactivar(
    vehiculoId: string
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/desactivar/${vehiculoId}`,
      {}
    );
  }

  private crearFormDataRegistro(
    request: RegistrarVehiculoRequest,
    foto?: File | null
  ): FormData {
    const formData = new FormData();

    formData.append(
      'PersonaId',
      request.personaId
    );

    formData.append(
      'Tipo',
      request.tipo.toString()
    );

    formData.append(
      'Placa',
      request.placa.trim().toUpperCase()
    );

    formData.append(
      'Marca',
      request.marca.trim()
    );

    formData.append(
      'Color',
      request.color.trim()
    );

    if (foto) {
      formData.append(
        'Foto',
        foto,
        foto.name
      );
    }

    return formData;
  }

  private crearFormDataActualizacion(
    request: ActualizarVehiculoRequest,
    foto?: File | null
  ): FormData {
    const formData = new FormData();

    formData.append(
      'Tipo',
      request.tipo.toString()
    );

    formData.append(
      'Placa',
      request.placa.trim().toUpperCase()
    );

    formData.append(
      'Marca',
      request.marca.trim()
    );

    formData.append(
      'Color',
      request.color.trim()
    );

    if (foto) {
      formData.append(
        'Foto',
        foto,
        foto.name
      );
    }

    return formData;
  }
}