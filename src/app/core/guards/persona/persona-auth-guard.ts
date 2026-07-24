import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const personaAuthGuard: CanActivateFn = () => {
  const router = inject(Router);

  const accessToken = localStorage.getItem('personaAccessToken');
  const refreshToken = localStorage.getItem('personaRefreshToken');

  if (!accessToken || !refreshToken) {
    return router.createUrlTree(['/loginPersona']);
  }

  return true;
};