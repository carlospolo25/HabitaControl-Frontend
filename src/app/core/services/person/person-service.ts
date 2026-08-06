import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface PersonResponse {
  id: string;

  name: string;
  document: string;
  phone: string;
  email: string;
  fotoUrl: string | null;

  personType: number;
  personTypeName: string;

  active: boolean;
  permanentlyDeactivated: boolean;
  permanentlyDeactivatedAt?: string | null;
  permanentlyDeactivatedBy?: string | null;
  status: string;

  tower: string;
  apartment: string;
  relationship: string;

  birthDate?: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodType: string;

  jobTitle: string;
  contractorCompany: string;

  receivesNotifications: boolean;
  notes: string;
}

export interface UpdatePersonRequest {
  name: string;
  phone: string;

  tower: string;
  apartment: string;
  relationship: string;

  birthDate?: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;


  jobTitle: string;
  contractorCompany: string;

  receivesNotifications: boolean;
  notes: string;
}

export interface ActualizarPerfilPersonaRequest {
  name: string;
  document: string;
  phone: string;
  email: string;

  tower: string;
  apartment: string;
  relationship: string;

  birthDate?: string | null;
  emergencyContactName: string;
  emergencyContactPhone: string;

  jobTitle: string;
  contractorCompany: string;

  receivesNotifications: boolean;
  notes: string;

  foto?: File | null;
}

export interface UpdateMyAccountResponse {
  message: string;
  person: PersonResponse;
}

export interface MessageResponse {
  message: string;
}

export interface CreateInvitationRequest {
  email: string;
  personType: number;
}

export interface InvitationResponse {
  id: string;
  email: string;
  token: string;
  used: boolean;
  expirationDate: string;
}

export interface CreateMassInvitationsRequest {
  emails: string[];
  personType: number;
}

export interface FailedInvitationResponse {
  email: string;
  reason: string;
}

export interface MassInvitationsResponse {
  totalProcessed: number;
  totalCreated: number;
  totalFailed: number;
  created: InvitationResponse[];
  failed: FailedInvitationResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class PersonService {
  private readonly apiUrl =
    'https://localhost:7232/api/Person';

  private readonly registerPersonUrl =
    'https://localhost:7232/api/RegisterPerson';

  private readonly dashboardUrl =
    'https://localhost:7232/api/Dashboard';

  constructor(
    private readonly http: HttpClient
  ) {}

  getPeople(): Observable<PersonResponse[]> {
    return this.http.get<PersonResponse[]>(
      this.apiUrl
    );
  }

  getSecurityVisiblePeople(): Observable<PersonResponse[]> {
    return this.http.get<PersonResponse[]>(
      `${this.apiUrl}/security-visible`
    );
  }

  updateMyAccount(
    request: UpdatePersonRequest
  ): Observable<UpdateMyAccountResponse> {
    return this.http.put<UpdateMyAccountResponse>(
      `${this.apiUrl}/me`,
      request
    );
  }

  /* =========================================================
     PERFIL DE LA PERSONA
     ========================================================= */

  obtenerMiPerfil(): Observable<PersonResponse> {
    return this.http.get<PersonResponse>(
      `${this.apiUrl}/perfil`
    );
  }

  actualizarMiPerfil(
    request: ActualizarPerfilPersonaRequest
  ): Observable<PersonResponse> {
    const formData =
      this.construirPerfilPersonaFormData(
        request
      );

    return this.http.put<PersonResponse>(
      `${this.apiUrl}/actualizar-perfil`,
      formData
    );
  }

  permanentlyDeactivateOwnAccount(): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(
      `${this.apiUrl}/me/permanent-deactivation`,
      {}
    );
  }

  createInvitation(
    request: CreateInvitationRequest
  ): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(
      `${this.registerPersonUrl}/invitation`,
      request
    );
  }

  createMassInvitations(
    request: CreateMassInvitationsRequest
  ): Observable<MassInvitationsResponse> {
    return this.http.post<MassInvitationsResponse>(
      `${this.registerPersonUrl}/invitaciones-masivas`,
      request
    );
  }

  togglePersonStatus(
    personId: string
  ): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(
      `${this.dashboardUrl}/person/${personId}/toggle-status`,
      {}
    );
  }

  private construirPerfilPersonaFormData(
    request: ActualizarPerfilPersonaRequest
  ): FormData {
    const formData = new FormData();

    /* =========================================================
      DATOS PERSONALES
      ========================================================= */

    formData.append(
      'Nombre',
      request.name.trim()
    );

    formData.append(
      'Documento',
      request.document.trim()
    );

    formData.append(
      'Telefono',
      request.phone.trim()
    );

    formData.append(
      'Email',
      request.email.trim()
    );

    /* =========================================================
      DATOS RESIDENCIALES
      ========================================================= */

    formData.append(
      'Torre',
      request.tower.trim()
    );

    formData.append(
      'Apartamento',
      request.apartment.trim()
    );

    formData.append(
      'Parentesco',
      request.relationship.trim()
    );

    /* =========================================================
      INFORMACIÓN DE CENSO
      ========================================================= */

    if (request.birthDate) {
      formData.append(
        'FechaNacimiento',
        request.birthDate
      );
    }

    formData.append(
      'ContactoEmergencia',
      request.emergencyContactName.trim()
    );

    formData.append(
      'TelefonoEmergencia',
      request.emergencyContactPhone.trim()
    );

    /* =========================================================
      INFORMACIÓN LABORAL
      ========================================================= */

    formData.append(
      'Cargo',
      request.jobTitle.trim()
    );

    formData.append(
      'EmpresaContratista',
      request.contractorCompany.trim()
    );

    /* =========================================================
      PREFERENCIAS
      ========================================================= */

    formData.append(
      'RecibeNotificaciones',
      request.receivesNotifications.toString()
    );

    formData.append(
      'Observaciones',
      request.notes.trim()
    );

    /* =========================================================
      FOTOGRAFÍA
      ========================================================= */

    if (request.foto) {
      formData.append(
        'Foto',
        request.foto,
        request.foto.name
      );
    }

    return formData;
  }
}