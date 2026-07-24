import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { finalize } from 'rxjs';

import { AuthPersona } from '../../../core/services/authPersona/auth-persona';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterPersonaComponent implements OnInit {
  token = '';

  estado: 'loading' | 'ok' | 'error' = 'loading';

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  tipoPersona = 0;
  nombre = '';
  documento = '';
  telefono = '';
  email = '';
  password = '';
  torre = '';
  apartamento = '';
  parentesco = '';
  otroParentesco = '';
  fechaNacimiento = '';
  contactoEmergencia = '';
  telefonoEmergencia = '';
  cargo = '';
  empresaContratista = '';
  observaciones = '';
  recibeNotificaciones = true;
  showPassword = false;

  

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authPersona: AuthPersona,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.estado = 'error';
      this.errorMessage = 'La invitación no es válida o no contiene token.';
      return;
    }

    this.validateToken();
  }

  validateToken(): void {
    this.estado = 'loading';
    this.errorMessage = '';

    this.authPersona.validarInvitacion(this.token).subscribe({
      next: (response: any) => {
        this.tipoPersona = Number(
          response.personType ??
          response.tipoPersona ??
          response.type ??
          response.tipo
        );

        this.estado = 'ok';
        this.cdr.detectChanges();
      },
      error: ({ error }) => {
        this.estado = 'error';
        this.errorMessage =
          error?.message ??
          'La invitación no es válida, fue usada o ya expiró.';
      },
    });
  }

  registrar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.isFormValid()) {
      return;
    }

    this.isSubmitting = true;

    const request = {
      token: this.token,

      name: this.nombre.trim(),
      document: this.documento.trim(),
      phone: this.telefono.trim(),
      email: this.email.trim(),
      password: this.password,

      tower: this.isResident
        ? this.torre.trim()
        : '',

      apartment: this.isResident
        ? this.apartamento.trim()
        : '',

      relationship: this.isResident
        ? (
            this.parentesco === 'Otro'
              ? this.otroParentesco.trim()
              : this.parentesco.trim()
          )
        : '',

      birthDate:
        this.isResident && this.fechaNacimiento
          ? this.fechaNacimiento
          : null,

      emergencyContactName: this.isResident
        ? this.contactoEmergencia.trim()
        : '',

      emergencyContactPhone: this.isResident
        ? this.telefonoEmergencia.trim()
        : '',

      jobTitle: this.isStaff
        ? this.cargo.trim()
        : '',

      contractorCompany: this.isStaff
        ? this.empresaContratista.trim()
        : '',

      receivesNotifications: this.recibeNotificaciones,

      notes: this.observaciones.trim(),
    };

    this.authPersona
      .completarRegistro(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Registro completado correctamente. Ya puedes iniciar sesión.';

          setTimeout(() => {
            this.router.navigate(['/loginPersona']);
          }, 1000);
        },

        error: ({ error }) => {
          const validationErrors = error?.errors;

          if (validationErrors) {
            const messages = Object.values(validationErrors)
              .flat()
              .filter(
                (message): message is string =>
                  typeof message === 'string'
              );

            this.errorMessage =
              messages.length > 0
                ? messages.join(' ')
                : 'Los datos enviados no son válidos.';
          } else {
            this.errorMessage =
              error?.message ??
              error?.title ??
              'No fue posible completar el registro. Inténtelo nuevamente.';
          }

          this.cdr.detectChanges();
        },
      });
  }

  isFormValid(): boolean {
    if (!this.nombre.trim()) {
      this.errorMessage = 'Ingrese su nombre completo.';
      return false;
    }

    if (!this.documento.trim()) {
      this.errorMessage = 'Ingrese su número de documento.';
      return false;
    }

    if (!this.telefono.trim()) {
      this.errorMessage = 'Ingrese su número de teléfono.';
      return false;
    }

    if (!this.email.trim()) {
      this.errorMessage = 'Ingrese su correo electrónico.';
      return false;
    }

    if (!this.isPasswordValid) {
      this.errorMessage =
        'La contraseña no cumple con los requisitos de seguridad.';
      return false;
    }

    if (this.isResident) {
      if (!this.torre.trim()) {
        this.errorMessage = 'Ingrese la torre o bloque de residencia.';
        return false;
      }

      if (!this.apartamento.trim()) {
        this.errorMessage = 'Ingrese el apartamento.';
        return false;
      }
    }

    if (this.isStaff && !this.cargo.trim()) {
      this.errorMessage = 'Ingrese el cargo que desempeña.';
      return false;
    }

    return true;
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  get isResident(): boolean {
    return this.tipoPersona === 1;
  }

  get isSecurity(): boolean {
    return this.tipoPersona === 2;
  }

  get isMaintenance(): boolean {
    return this.tipoPersona === 3;
  }

  get isStaff(): boolean {
    return this.isSecurity || this.isMaintenance;
  }

  get isPasswordValid(): boolean {
    return (
      this.password.length >= 8 &&
      this.tieneMayuscula(this.password) &&
      this.tieneMinuscula(this.password) &&
      this.tieneNumero(this.password) &&
      this.tieneEspecial(this.password)
    );
  }

  tieneMayuscula(valor: string): boolean {
    return /[A-Z]/.test(valor);
  }

  tieneMinuscula(valor: string): boolean {
    return /[a-z]/.test(valor);
  }

  tieneNumero(valor: string): boolean {
    return /[0-9]/.test(valor);
  }

  tieneEspecial(valor: string): boolean {
    return /[\W_]/.test(valor);
  }
}