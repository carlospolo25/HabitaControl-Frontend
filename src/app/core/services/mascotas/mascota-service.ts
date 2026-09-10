import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../config/api.config';

export enum TipoMascota {
  Perro = 1,
  Gato = 2,
  Ave = 3,
  Otro = 4,
}

export interface RegistrarMascotaRequest {
  personaId: string;

  nombre: string;
  tipo: TipoMascota;

  raza: string;
  color: string;

  fechaNacimiento?: string | null;
  observaciones?: string | null;
}

export interface ActualizarMascotaRequest {
  nombre: string;
  tipo: TipoMascota;

  raza: string;
  color: string;

  fechaNacimiento?: string | null;
  observaciones?: string | null;
}

export interface MascotaResponse {
  id: string;
  personaId: string;

  nombre: string;
  tipo: TipoMascota;

  raza: string;
  color: string;

  fechaNacimiento: string | null;
  observaciones: string | null;

  fotoUrl: string | null;

  activo: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MascotaService {
  
  private readonly apiUrl =
    `${API_CONFIG.baseUrl}/Mascota`;

  constructor(
    private readonly http: HttpClient
  ) {}

  registrar(
    request: RegistrarMascotaRequest,
    foto?: File | null
  ): Observable<MascotaResponse> {
    const formData = this.crearFormDataRegistro(
      request,
      foto
    );

    return this.http.post<MascotaResponse>(
      `${this.apiUrl}/registrar`,
      formData
    );
  }

  obtenerPorPersona(
    personaId: string
  ): Observable<MascotaResponse[]> {
    return this.http.get<MascotaResponse[]>(
      `${this.apiUrl}/persona/${personaId}`
    );
  }

  obtenerFotoUrl(
    mascotaId: string
  ): string {
    return `${this.apiUrl}/${mascotaId}/foto`;
  }

  actualizar(
    mascotaId: string,
    request: ActualizarMascotaRequest,
    foto?: File | null
  ): Observable<MascotaResponse> {
    const formData = this.crearFormDataActualizacion(
      request,
      foto
    );

    return this.http.put<MascotaResponse>(
      `${this.apiUrl}/actualizar/${mascotaId}`,
      formData
    );
  }

  desactivar(
    mascotaId: string
  ): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/desactivar/${mascotaId}`,
      {}
    );
  }

  private crearFormDataRegistro(
    request: RegistrarMascotaRequest,
    foto?: File | null
  ): FormData {
    const formData = new FormData();

    formData.append(
      'PersonaId',
      request.personaId
    );

    formData.append(
      'Nombre',
      request.nombre.trim()
    );

    formData.append(
      'Tipo',
      request.tipo.toString()
    );

    formData.append(
      'Raza',
      request.raza.trim()
    );

    formData.append(
      'Color',
      request.color.trim()
    );

    if (request.fechaNacimiento) {
      formData.append(
        'FechaNacimiento',
        request.fechaNacimiento
      );
    }

    if (request.observaciones?.trim()) {
      formData.append(
        'Observaciones',
        request.observaciones.trim()
      );
    }

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
    request: ActualizarMascotaRequest,
    foto?: File | null
  ): FormData {
    const formData = new FormData();

    formData.append(
      'Nombre',
      request.nombre.trim()
    );

    formData.append(
      'Tipo',
      request.tipo.toString()
    );

    formData.append(
      'Raza',
      request.raza.trim()
    );

    formData.append(
      'Color',
      request.color.trim()
    );

    if (request.fechaNacimiento) {
      formData.append(
        'FechaNacimiento',
        request.fechaNacimiento
      );
    }

    if (request.observaciones?.trim()) {
      formData.append(
        'Observaciones',
        request.observaciones.trim()
      );
    }

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