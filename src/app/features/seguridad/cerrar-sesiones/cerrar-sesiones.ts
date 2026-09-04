import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth';
import { AuthPersona } from '../../../core/services/authPersona/auth-persona';

import { finalize } from 'rxjs';

import {
  CerrarSesionesAlertaResponse,
  SeguridadService,
} from '../../../core/services/seguridad/seguridad';

import {
  AuthSessionContext,
} from '../../../core/Auth/auth-session-context';

@Component({
  selector: 'app-cerrar-sesiones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cerrar-sesiones.html',
  styleUrl: './cerrar-sesiones.css',
})
export class CerrarSesionesComponent implements OnInit {
  token = '';

  estado:
    | 'confirmacion'
    | 'procesando'
    | 'exito'
    | 'error' = 'confirmacion';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly seguridadService: SeguridadService,
    private readonly authService: AuthService,
    private readonly authPersona: AuthPersona,
    private readonly sessionContext: AuthSessionContext,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe({
      next: (params) => {
        this.token = params.get('token')?.trim() ?? '';

        if (!this.token) {
          this.estado = 'error';
          this.errorMessage =
            'El enlace de seguridad es inválido o no contiene un token.';
          this.successMessage = '';
        } else {
          this.estado = 'confirmacion';
          this.errorMessage = '';
          this.successMessage = '';
        }

        this.cdr.detectChanges();
      },
    });
  }

  cerrarSesiones(): void {
    if (this.isLoading) {
      return;
    }

    if (!this.token) {
      this.estado = 'error';
      this.errorMessage =
        'El enlace de seguridad no contiene un token válido.';
      this.successMessage = '';
      return;
    }

    this.isLoading = true;
    this.estado = 'procesando';
    this.errorMessage = '';
    this.successMessage = '';

    this.seguridadService
      .cerrarTodasLasSesiones(this.token)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: CerrarSesionesAlertaResponse) => {
          if (!response.exitoso) {
            this.estado = 'error';
            this.errorMessage =
              response.mensaje ||
              'No fue posible cerrar las sesiones.';

            this.cdr.detectChanges();
            return;
          }

          this.limpiarSesionesLocales();

          this.estado = 'exito';
          this.successMessage =
            response.mensaje ||
            'Todas las sesiones fueron cerradas correctamente.';

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.estado = 'error';

          this.errorMessage =
            error?.error?.mensaje ||
            error?.error?.message ||
            'No fue posible cerrar las sesiones. El enlace puede haber expirado o ya fue utilizado.';

          this.cdr.detectChanges();
        },
      });
  }

  irAlLoginAdministrador(): void {
    void this.router.navigate(['/login']);
  }

  irAlLoginPersona(): void {
    void this.router.navigate(['/loginPersona']);
  }

  private limpiarSesionesLocales(): void {
    this.sessionContext.clear();

    this.authPersona
      .logoutPersona()
      .subscribe({
        next: () => {
          // Cookies Persona eliminadas.
        },

        error: (error) => {
          console.warn(
            'Las sesiones fueron revocadas, pero no fue posible completar la limpieza de las cookies Persona:',
            error
          );
        },
      });

    this.authService
      .logout()
      .subscribe({
        next: () => {
          // Cookies Admin eliminadas.
        },

        error: (error) => {
          console.warn(
            'Las sesiones fueron revocadas, pero no fue posible completar la limpieza de las cookies Admin:',
            error
          );
        },
      });
  }
}