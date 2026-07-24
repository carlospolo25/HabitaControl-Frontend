import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import {
  CreateInvitationRequest,
  CreateMassInvitationsRequest,
  MassInvitationsResponse,
  PersonService,
} from '../../../core/services/person/person-service';

type InvitationMode = 'single' | 'mass';

interface PersonTypeOption {
  value: number;
  label: string;
  description: string;
}

@Component({
  selector: 'app-person-invitation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './person-invitation.html',
  styleUrl: './person-invitation.css',
})
export class PersonInvitation {
  @Output()
  readonly close = new EventEmitter<void>();

  @Output()
  readonly created = new EventEmitter<void>();

  readonly personTypes: PersonTypeOption[] = [
    {
      value: 1,
      label: 'Residente',
      description: 'Propietario, arrendatario o integrante del hogar.',
    },
    {
      value: 2,
      label: 'Seguridad',
      description: 'Personal encargado del control de acceso.',
    },
    {
      value: 3,
      label: 'Mantenimiento',
      description: 'Personal operativo o de servicios generales.',
    },
  ];

  invitationMode: InvitationMode = 'single';

  email = '';
  massEmails = '';
  personType = 1;

  loading = false;

  errorMessage = '';
  successMessage = '';

  massResult: MassInvitationsResponse | null = null;

  constructor(
    private readonly personService: PersonService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  changeMode(mode: InvitationMode): void {
    if (this.loading || this.invitationMode === mode) {
      return;
    }

    this.invitationMode = mode;
    this.resetMessages();
    this.resetResult();
  }

  sendInvitation(): void {
    if (this.loading) {
      return;
    }

    const normalizedEmail = this.normalizeEmail(this.email);

    if (!normalizedEmail) {
      this.errorMessage =
        'Debes ingresar el correo electrónico de la persona.';
      return;
    }

    if (!this.isValidEmail(normalizedEmail)) {
      this.errorMessage =
        'Ingresa un correo electrónico válido.';
      return;
    }

    if (!this.isValidPersonType(this.personType)) {
      this.errorMessage =
        'Selecciona un tipo de persona válido.';
      return;
    }

    const request: CreateInvitationRequest = {
      email: normalizedEmail,
      personType: this.personType,
    };

    this.startRequest();

    this.personService
      .createInvitation(request)
      .pipe(
        finalize(() => {
          this.finishRequest();
        })
      )
      .subscribe({
        next: response => {
          this.email = response.email;

          this.successMessage =
            `La invitación para ${response.email} fue creada correctamente.`;

          this.created.emit();
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Error creando invitación individual:',
            error
          );

          this.errorMessage =
            this.getErrorMessage(
              error,
              'No se pudo crear la invitación.'
            );
        },
      });
  }

  sendMassInvitations(): void {
    if (this.loading) {
      return;
    }

    const emails = this.parseMassEmails(
      this.massEmails
    );

    if (emails.length === 0) {
      this.errorMessage =
        'Debes ingresar al menos un correo electrónico.';
      return;
    }

    const invalidEmails = emails.filter(
      email => !this.isValidEmail(email)
    );

    if (invalidEmails.length > 0) {
      const preview = invalidEmails
        .slice(0, 3)
        .join(', ');

      const additional =
        invalidEmails.length > 3
          ? ` y ${invalidEmails.length - 3} más`
          : '';

      this.errorMessage =
        `Hay correos con formato inválido: ${preview}${additional}.`;

      return;
    }

    if (!this.isValidPersonType(this.personType)) {
      this.errorMessage =
        'Selecciona un tipo de persona válido.';
      return;
    }

    const request: CreateMassInvitationsRequest = {
      emails,
      personType: this.personType,
    };

    this.startRequest();

    this.personService
      .createMassInvitations(request)
      .pipe(
        finalize(() => {
          this.finishRequest();
        })
      )
      .subscribe({
        next: response => {
          this.massResult = response;
          this.successMessage =
            this.buildMassSuccessMessage(response);

          if (response.totalCreated > 0) {
            this.created.emit();
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error(
            'Error creando invitaciones masivas:',
            error
          );

          this.errorMessage =
            this.getErrorMessage(
              error,
              'No se pudieron crear las invitaciones.'
            );
        },
      });
  }

  cancel(): void {
    if (this.loading) {
      return;
    }

    this.close.emit();
  }

  clearSingleEmail(): void {
    if (this.loading) {
      return;
    }

    this.email = '';
    this.resetMessages();
  }

  clearMassEmails(): void {
    if (this.loading) {
      return;
    }

    this.massEmails = '';
    this.resetMessages();
    this.resetResult();
  }

  clearMessages(): void {
    this.resetMessages();
  }

  get selectedPersonTypeLabel(): string {
    return (
      this.personTypes.find(
        option =>
          option.value === Number(this.personType)
      )?.label ?? 'Tipo no definido'
    );
  }

  get parsedEmailsCount(): number {
    return this.parseMassEmails(
      this.massEmails
    ).length;
  }

  get canSendSingleInvitation(): boolean {
    return (
      !this.loading &&
      this.isValidEmail(
        this.normalizeEmail(this.email)
      ) &&
      this.isValidPersonType(this.personType)
    );
  }

  get canSendMassInvitations(): boolean {
    if (this.loading) {
      return false;
    }

    const emails = this.parseMassEmails(
      this.massEmails
    );

    return (
      emails.length > 0 &&
      emails.every(email =>
        this.isValidEmail(email)
      ) &&
      this.isValidPersonType(this.personType)
    );
  }

  private startRequest(): void {
    this.loading = true;
    this.resetMessages();
    this.resetResult();
  }

  private finishRequest(): void {
    this.loading = false;
    this.cdr.detectChanges();
  }

  private resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private resetResult(): void {
    this.massResult = null;
  }

  private parseMassEmails(value: string): string[] {
    const normalizedEmails = value
      .split(/[\s,;\n\r]+/)
      .map(email => this.normalizeEmail(email))
      .filter(email => email.length > 0);

    return Array.from(
      new Set(normalizedEmails)
    );
  }

  private normalizeEmail(email: string): string {
    return email
      .trim()
      .toLowerCase();
  }

  private isValidEmail(email: string): boolean {
    if (!email) {
      return false;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return emailPattern.test(email);
  }

  private isValidPersonType(
    personType: number
  ): boolean {
    return this.personTypes.some(
      option =>
        option.value === Number(personType)
    );
  }

  private buildMassSuccessMessage(
    response: MassInvitationsResponse
  ): string {
    if (
      response.totalCreated > 0 &&
      response.totalFailed === 0
    ) {
      return response.totalCreated === 1
        ? 'Se creó correctamente una invitación.'
        : `Se crearon correctamente ${response.totalCreated} invitaciones.`;
    }

    if (
      response.totalCreated === 0 &&
      response.totalFailed > 0
    ) {
      return response.totalFailed === 1
        ? 'El proceso terminó, pero la invitación no pudo ser creada.'
        : `El proceso terminó, pero las ${response.totalFailed} invitaciones fallaron.`;
    }

    return (
      `Proceso finalizado: ` +
      `${response.totalCreated} creadas y ` +
      `${response.totalFailed} fallidas.`
    );
  }

private getErrorMessage(
  error: HttpErrorResponse,
  fallbackMessage: string
): string {
  const rawError = error?.error;

  if (
    typeof rawError === 'string' &&
    rawError.trim().length > 0
  ) {
    return rawError.trim();
  }

  const backendMessage =
    rawError?.message ??
    rawError?.mensaje ??
    rawError?.title;

  if (
    typeof backendMessage === 'string' &&
    backendMessage.trim().length > 0
  ) {
    return backendMessage.trim();
  }

  const validationError =
    this.getValidationError(error);

  if (validationError) {
    return validationError;
  }

  switch (error.status) {
    case 0:
      return 'No fue posible conectarse con el servidor. Verifica que la API esté disponible.';

    case 400:
      return 'La información enviada no es válida. Revisa los campos del formulario.';

    case 401:
      return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

    case 403:
      return 'No tienes permisos para crear invitaciones.';

    case 404:
      return 'No se encontró el recurso solicitado.';

    case 409:
      return 'La invitación no pudo procesarse por un conflicto con la información enviada.';

    case 422:
      return 'No fue posible procesar la información suministrada.';

    case 500:
      return 'Ocurrió un error interno al crear las invitaciones.';

    case 503:
      return 'El servicio de correo no está disponible en este momento.';

    default:
      return fallbackMessage;
  }
}

  private getValidationError(
    error: HttpErrorResponse
  ): string | null {
    const errors = error?.error?.errors;

    if (
      !errors ||
      typeof errors !== 'object'
    ) {
      return null;
    }

    const messages = Object.values(errors)
      .flatMap(value =>
        Array.isArray(value)
          ? value
          : [value]
      )
      .filter(
        (message): message is string =>
          typeof message === 'string' &&
          message.trim().length > 0
      );

    return messages[0] ?? null;
  }
}