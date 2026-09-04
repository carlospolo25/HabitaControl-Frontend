import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
} from '@angular/router';

import {
  catchError,
  map,
  of,
} from 'rxjs';

import {
  AuthPersona,
} from '../../services/authPersona/auth-persona';

import {
  AuthSessionContext,
} from '../../../core/Auth/auth-session-context';

export const noPersonaAuthGuard:
  CanActivateFn = () => {

    const router =
      inject(Router);

    const authPersona =
      inject(AuthPersona);

    const sessionContext =
      inject(AuthSessionContext);

    return authPersona
      .comprobarSesion()
      .pipe(
        map(() => {
          /*
           * Existe una sesión Persona válida.
           *
           * Reconstruimos el contexto de identidad
           * y evitamos volver al login.
           */
          sessionContext
            .setPersona();

          return router.createUrlTree([
            '/dashboard-persona',
          ]);
        }),

        catchError(() => {
          /*
           * No existe sesión Persona válida.
           *
           * Permitimos acceder al login.
           */
          return of(true);
        })
      );
  };