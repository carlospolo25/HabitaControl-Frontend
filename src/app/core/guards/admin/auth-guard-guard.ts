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

export const authGuardGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.obtenerPerfil().pipe(
    map(() => true),

    catchError(() => {
      return of(
        router.createUrlTree([
          '/login',
        ])
      );
    })
  );
};