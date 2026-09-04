import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth/auth';
import { ChangeDetectorRef } from '@angular/core';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  tenantName = '';
  tenantNit = '';
  domain = '';
  address = '';
  city = '';
  companyPhone = '';
  contactEmail = '';
  propertyType = '';
  towerCount: number | null = null;
  apartmentCount: number | null = null;

  adminName = '';
  adminDocument = '';
  adminPhone = '';
  adminEmail = '';
  password = '';

  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showPassword = false;
  acceptPolicies = false;

  constructor(private authService: AuthService,
              private cdr: ChangeDetectorRef,
              private router: Router
              ) {}

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  hasLowercase(): boolean {
    return /[a-z]/.test(this.password);
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.password);
  }

  hasSpecialCharacter(): boolean {
    return /[\W_]/.test(this.password);
  }

  hasMinimumLength(): boolean {
    return this.password.length >= 8;
  }

  isPasswordValid(): boolean {
    return (
      this.hasMinimumLength() &&
      this.hasUppercase() &&
      this.hasLowercase() &&
      this.hasNumber() &&
      this.hasSpecialCharacter()
    );
  }

  register(): void {
    if (this.isLoading) return;

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateForm()) return;

    const data = {
      nombreEmpresa: this.tenantName.trim(),
      dominio: (this.domain || this.tenantName).trim().toLowerCase(),
      nit: this.tenantNit.trim(),

      direccion: this.address.trim(),
      ciudad: this.city.trim(),
      telefonoEmpresa: this.companyPhone.trim(),
      emailContacto: this.contactEmail.trim().toLowerCase(),
      tipoPropiedad: this.propertyType.trim(),
      cantidadTorres: this.towerCount,
      cantidadApartamentos: this.apartmentCount,

      adminNombre: this.adminName.trim(),
      adminDocumento: this.adminDocument.trim(),
      adminTelefono: this.adminPhone.trim(),
      adminEmail: this.adminEmail.trim().toLowerCase(),
      adminPassword: this.password,
    };

    this.isLoading = true;

    this.authService.register(data)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage =
            'Registro completado correctamente. Ya puedes iniciar sesión.';

          this.clearSensitiveFields();

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        },
        error: (error) => {
          this.errorMessage = this.getRegisterErrorMessage(error);
          this.cdr.detectChanges();
        },
    });
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  openPrivacyPolicy(): void {
    window.open('/politica-privacidad', '_blank');
  }

  openTerms(): void {
    window.open('/terminos-condiciones', '_blank');
  }


  private validateForm(): boolean {
    if (!this.tenantName.trim()) {
      this.errorMessage = 'Ingresa el nombre del conjunto residencial.';
      return false;
    }

    if (!this.tenantNit.trim()) {
      this.errorMessage = 'Ingresa el NIT del conjunto.';
      return false;
    }

    if (!this.city.trim()) {
      this.errorMessage = 'Ingresa la ciudad.';
      return false;
    }

    if (!this.adminName.trim()) {
      this.errorMessage = 'Ingresa el nombre del administrador.';
      return false;
    }

    if (!this.adminDocument.trim()) {
      this.errorMessage = 'Ingresa el documento del administrador.';
      return false;
    }

    if (!this.adminEmail.trim()) {
      this.errorMessage = 'Ingresa el correo del administrador.';
      return false;
    }

    if (!this.isValidEmail(this.adminEmail)) {
      this.errorMessage = 'El correo del administrador no es válido.';
      return false;
    }

    if (this.contactEmail.trim() && !this.isValidEmail(this.contactEmail)) {
      this.errorMessage = 'El correo de contacto no es válido.';
      return false;
    }

    if (!this.isPasswordValid()) {
      this.errorMessage = 'La contraseña no cumple los requisitos de seguridad.';
      return false;
    }

    if (this.towerCount === null || this.towerCount < 1) {
      this.errorMessage = 'La cantidad de torres debe ser mínimo 1.';
      return false;
    }

    if (this.apartmentCount === null || this.apartmentCount < 1) {
      this.errorMessage = 'La cantidad de apartamentos debe ser mínimo 1.';
      return false;
    }

    if (!this.hasValidNitFormat(this.tenantNit)) {
      this.errorMessage = 'Ingresa un NIT válido.';
      return false;
    }
    return true;
  }

  private isValidEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  }

  private clearSensitiveFields(): void {
    this.password = '';
  }

  private hasValidNitFormat(nit: string): boolean {

    if (!nit || !nit.trim()) {
      return false;
    }

    const cleanNit = nit.replace(/[.\-\s]/g, '');

    // Solo números
    if (!/^\d+$/.test(cleanNit)) {
      return false;
    }

    // Entre 5 y 15 dígitos
    return cleanNit.length >= 5 && cleanNit.length <= 15;
  }

  private getRegisterErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'No hay conexión con el servidor.';
    }

    if (error.status === 400 && error?.error?.message) {
      return error.error.message;
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    return 'No fue posible completar el registro. Verifica la información e intenta nuevamente.';
  }
  
}