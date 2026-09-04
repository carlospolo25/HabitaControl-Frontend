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

import { AuthService } from '../../services/auth/auth';

export const noAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.comprobarSesion().pipe(
    /*
     * Si el backend acepta la cookie,
     * ya existe una sesión Admin válida.
     *
     * No permitimos volver al login.
     */
    map(() => {
      return router.createUrlTree([
        '/dashboard',
      ]);
    }),

    /*
     * Si no existe sesión válida,
     * comprobarSesion() devuelve 401.
     *
     * SKIP_AUTH_REFRESH evita que el
     * interceptor intente renovar la sesión.
     *
     * Por lo tanto permitimos entrar
     * normalmente a /login o /register.
     */
    catchError(() => {
      return of(true);
    })
  );
};