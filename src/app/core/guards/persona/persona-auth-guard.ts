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

export const personaAuthGuard:
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
          sessionContext
            .setPersona();

          return true;
        }),

        catchError(() => {
          sessionContext.clear();

          return of(
            router.createUrlTree([
              '/loginPersona',
            ])
          );
        })
      );
  };