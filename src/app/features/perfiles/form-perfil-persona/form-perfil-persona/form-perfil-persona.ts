import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';

import {
  ActualizarPerfilPersonaRequest,
  PersonResponse,
  PersonService,
} from '../../../../core/services/person/person-service';

import {
  fechaCivilComparable
} from '../../../../core/utils/colombia-date.util';

@Component({
  selector: 'app-form-perfil-persona',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-perfil-persona.html',
  styleUrl: './form-perfil-persona.css',
})
export class FormPerfilPersonaComponent
  implements OnChanges, OnDestroy {

  @Input({ required: true })
  perfil: PersonResponse | null = null;

  @Output()
  cerrar = new EventEmitter<void>();

  @Output()
  perfilActualizado =
    new EventEmitter<PersonResponse>();

  private readonly tiposImagenPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly tamanoMaximoFoto =
    5 * 1024 * 1024;

  /* =========================================================
     DATOS COMUNES
     ========================================================= */

  name = '';
  phone = '';

  birthDate: string | null = null;
  emergencyContactName = '';
  emergencyContactPhone = '';
  bloodType = '';

  receivesNotifications = true;
  notes = '';

  /* =========================================================
     DATOS DE RESIDENTE
     ========================================================= */

  tower = '';
  apartment = '';
  relationship = '';

  /* =========================================================
     DATOS DE SEGURIDAD / MANTENIMIENTO
     ========================================================= */

  jobTitle = '';
  contractorCompany = '';

  /* =========================================================
     FOTOGRAFÍA
     ========================================================= */

  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;
  fotoActualUrl: string | null = null;
  fotoNoDisponible = false;

  /* =========================================================
     ESTADOS
     ========================================================= */

  isSubmitting = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly personService: PersonService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['perfil'] &&
      this.perfil
    ) {
      this.cargarDatosPerfil(
        this.perfil
      );
    }
  }

  ngOnDestroy(): void {
    this.liberarFotoPreview();
  }

  /* =========================================================
     TIPO DE PERSONA
     ========================================================= */

  esResidente(): boolean {
    return this.perfil?.personType === 1;
  }

  esSeguridad(): boolean {
    return this.perfil?.personType === 2;
  }

  esMantenimiento(): boolean {
    return this.perfil?.personType === 3;
  }

  esPersonalConjunto(): boolean {
    return (
      this.esSeguridad() ||
      this.esMantenimiento()
    );
  }

  obtenerNombreTipoPersona(): string {
    return (
      this.perfil?.personTypeName?.trim() ||
      'Persona'
    );
  }

  /* =========================================================
     FOTOGRAFÍA
     ========================================================= */

  seleccionarFoto(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.item(0) ?? null;

    this.limpiarMensajes();

    if (!archivo) {
      return;
    }

    if (
      !this.tiposImagenPermitidos.includes(
        archivo.type
      )
    ) {
      input.value = '';

      this.errorMessage =
        'La fotografía debe estar en formato JPG, PNG o WebP.';

      return;
    }

    if (
      archivo.size >
      this.tamanoMaximoFoto
    ) {
      input.value = '';

      this.errorMessage =
        'La fotografía no puede superar los 5 MB.';

      return;
    }

    this.liberarFotoPreview();

    this.fotoSeleccionada = archivo;
    this.fotoPreview =
      URL.createObjectURL(archivo);

    this.fotoNoDisponible = false;
  }

  quitarFotoSeleccionada(
    inputFoto?: HTMLInputElement
  ): void {
    if (this.isSubmitting) {
      return;
    }

    this.liberarFotoPreview();

    this.fotoSeleccionada = null;
    this.fotoPreview = null;
    this.fotoNoDisponible = false;

    if (inputFoto) {
      inputFoto.value = '';
    }
  }

  obtenerFotoVisible(): string | null {
    if (this.fotoNoDisponible) {
      return null;
    }

    return (
      this.fotoPreview ??
      this.fotoActualUrl
    );
  }

  manejarErrorFoto(): void {
    this.fotoNoDisponible = true;
  }

  obtenerIniciales(): string {
    const nombreNormalizado =
      this.name.trim();

    if (!nombreNormalizado) {
      return 'PE';
    }

    const partes = nombreNormalizado
      .split(/\s+/)
      .filter(
        parte => parte.length > 0
      );

    if (partes.length === 1) {
      return partes[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${partes[0][0]}${partes[1][0]}`
      .toUpperCase();
  }

  /* =========================================================
     GUARDAR
     ========================================================= */

  guardar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarMensajes();

    const mensajeValidacion =
      this.validarFormulario();

    if (mensajeValidacion) {
      this.errorMessage =
        mensajeValidacion;

      return;
    }

    const request: ActualizarPerfilPersonaRequest = {
      name: this.name.trim(),

      document:
        this.perfil?.document?.trim() ?? '',

      phone: this.phone.trim(),

      email:
        this.perfil?.email?.trim() ?? '',

      tower: this.esResidente()
        ? this.tower.trim()
        : '',

      apartment: this.esResidente()
        ? this.apartment.trim()
        : '',

      relationship: this.esResidente()
        ? this.relationship.trim()
        : '',

      birthDate:
        this.normalizarFechaOpcional(
          this.birthDate
        ),

      emergencyContactName:
        this.emergencyContactName.trim(),

      emergencyContactPhone:
        this.emergencyContactPhone.trim(),

      jobTitle: this.esPersonalConjunto()
        ? this.jobTitle.trim()
        : '',

      contractorCompany:
        this.esPersonalConjunto()
          ? this.contractorCompany.trim()
          : '',

      receivesNotifications:
        this.receivesNotifications,

      notes:
        this.notes.trim(),

      foto:
        this.fotoSeleccionada,
    };

    this.isSubmitting = true;

    this.personService
      .actualizarMiPerfil(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: perfilActualizado => {
          this.successMessage =
            'El perfil fue actualizado correctamente.';

          this.liberarFotoPreview();

          this.fotoSeleccionada = null;
          this.fotoPreview = null;

          this.cargarDatosPerfil(
            perfilActualizado
          );

          this.perfilActualizado.emit(
            perfilActualizado
          );
        },
        error: error => {
          console.error(
            'Error actualizando el perfil de la persona:',
            error
          );

          this.errorMessage =
            this.obtenerMensajeError(error);
        },
      });
  }

  cancelar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.liberarFotoPreview();
    this.cerrar.emit();
  }

  cerrarError(): void {
    this.errorMessage = '';
  }

  cerrarExito(): void {
    this.successMessage = '';
  }

  /* =========================================================
     CARGA DEL PERFIL
     ========================================================= */

  private cargarDatosPerfil(
    perfil: PersonResponse
  ): void {
    this.name =
      perfil.name ?? '';

    this.phone =
      perfil.phone ?? '';

    this.tower =
      perfil.tower ?? '';

    this.apartment =
      perfil.apartment ?? '';

    this.relationship =
      perfil.relationship ?? '';

    this.birthDate =
      this.formatearFechaParaInput(
        perfil.birthDate
      );

    this.emergencyContactName =
      perfil.emergencyContactName ?? '';

    this.emergencyContactPhone =
      perfil.emergencyContactPhone ?? '';

    this.jobTitle =
      perfil.jobTitle ?? '';

    this.contractorCompany =
      perfil.contractorCompany ?? '';

    this.receivesNotifications =
      perfil.receivesNotifications ?? true;

    this.notes =
      perfil.notes ?? '';

    this.liberarFotoPreview();

    this.fotoSeleccionada = null;
    this.fotoPreview = null;
    this.fotoNoDisponible = false;

    this.fotoActualUrl =
      perfil.fotoUrl
        ? this.personService.obtenerFotoUrl(
            perfil.id
          )
        : null;

    this.limpiarMensajes();
  }

  /* =========================================================
     VALIDACIONES
     ========================================================= */

  private validarFormulario(): string {
    const name =
      this.name.trim();

    const phone =
      this.phone.trim();

    const emergencyContactName =
      this.emergencyContactName.trim();

    const emergencyContactPhone =
      this.emergencyContactPhone.trim();

    if (!name) {
      return 'El nombre es obligatorio.';
    }

    if (name.length > 150) {
      return 'El nombre no puede superar los 150 caracteres.';
    }

    if (!phone) {
      return 'El teléfono es obligatorio.';
    }

    if (phone.length > 30) {
      return 'El teléfono no puede superar los 30 caracteres.';
    }

    if (this.esResidente()) {
      if (!this.tower.trim()) {
        return 'La torre es obligatoria para residentes.';
      }

      if (!this.apartment.trim()) {
        return 'El apartamento es obligatorio para residentes.';
      }

      if (!this.relationship.trim()) {
        return 'El parentesco o relación es obligatorio para residentes.';
      }
    }

    if (this.esPersonalConjunto()) {
      if (!this.jobTitle.trim()) {
        return 'El cargo es obligatorio para el personal del conjunto.';
      }
    }

    if (!emergencyContactName) {
      return 'El nombre del contacto de emergencia es obligatorio.';
    }

    if (!emergencyContactPhone) {
      return 'El teléfono del contacto de emergencia es obligatorio.';
    }

    if (
      this.fotoSeleccionada &&
      !this.tiposImagenPermitidos.includes(
        this.fotoSeleccionada.type
      )
    ) {
      return 'La fotografía debe estar en formato JPG, PNG o WebP.';
    }

    if (
      this.fotoSeleccionada &&
      this.fotoSeleccionada.size >
        this.tamanoMaximoFoto
    ) {
      return 'La fotografía no puede superar los 5 MB.';
    }

    return '';
  }

  /* =========================================================
     FECHAS
     ========================================================= */

  private formatearFechaParaInput(
    fecha: string | null | undefined
  ): string | null {
    if (!fecha) {
      return null;
    }

    const fechaNormalizada =
      fechaCivilComparable(fecha);

    return fechaNormalizada || null;
  }

  private normalizarFechaOpcional(
    fecha: string | null
  ): string | null {
    const valor =
      fecha?.trim();

    return valor || null;
  }

  /* =========================================================
     URL DE LA FOTO
     ========================================================= */
  private liberarFotoPreview(): void {
    if (
      this.fotoPreview?.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        this.fotoPreview
      );
    }
  }

  /* =========================================================
     MENSAJES DEL BACKEND
     ========================================================= */

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private obtenerMensajeError(
    error: any
  ): string {
    const backendMessage =
      error?.error?.message ??
      error?.error?.mensaje ??
      error?.error?.title;

    if (
      typeof backendMessage ===
        'string' &&
      backendMessage.trim()
    ) {
      return backendMessage;
    }

    const validationErrors =
      error?.error?.errors;

    if (
      validationErrors &&
      typeof validationErrors === 'object'
    ) {
      const firstValidationError =
        Object.values(validationErrors)
          .flat()
          .find(
            message =>
              typeof message ===
                'string' &&
              message.trim().length > 0
          );

      if (
        typeof firstValidationError ===
        'string'
      ) {
        return firstValidationError;
      }
    }

    switch (error?.status) {
      case 0:
        return 'No fue posible conectarse con el servidor. Verifica que la API esté disponible.';

      case 400:
        return 'La información enviada no es válida. Revisa los campos del formulario.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para actualizar este perfil.';

      case 404:
        return 'No se encontró la información de la persona.';

      case 409:
        return 'No fue posible completar la actualización por una regla del sistema.';

      case 413:
        return 'La fotografía enviada supera el tamaño permitido.';

      case 415:
        return 'El formato de la fotografía no es compatible.';

      case 500:
        return 'Ocurrió un error interno al actualizar el perfil.';

      default:
        return 'No fue posible actualizar el perfil.';
    }
  }
}