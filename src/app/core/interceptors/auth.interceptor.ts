import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';

import { AuthService } from '../services/auth/auth';
import { AuthPersona } from '../services/authPersona/auth-persona';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const authPersona = inject(AuthPersona);
  const router = inject(Router);

  const isPublicRoute =
    req.url.includes('validar-invitacion-persona') ||
    req.url.includes('validate-invitacion') ||
    req.url.includes('completar-registro') ||
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout') ||
    req.url.includes('/authPersona/login-persona') ||
    req.url.includes('/authPersona/refresh') ||
    req.url.includes('/authPersona/logout');

  if (isPublicRoute) {
    return next(req);
  }

  const adminAccessToken = authService.getAccessToken();
  const adminRefreshToken = authService.getRefreshToken();

  const personaAccessToken = localStorage.getItem('personaAccessToken');
  const personaRefreshToken = localStorage.getItem('personaRefreshToken');

  const isPersonaSession = !!personaAccessToken && !adminAccessToken;
  const accessToken = isPersonaSession ? personaAccessToken : adminAccessToken;
  const refreshToken = isPersonaSession ? personaRefreshToken : adminRefreshToken;

  const authRequest = accessToken
    ? addToken(req, accessToken)
    : req;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (!refreshToken) {
        clearSessionAndRedirect(isPersonaSession, authService, authPersona, router);
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        const refreshRequest$ = isPersonaSession
          ? authPersona.refreshTokenPersona()
          : authService.refreshToken();

        return refreshRequest$.pipe(
          switchMap((tokens) => {
            isRefreshing = false;

            if (isPersonaSession) {
              authPersona.guardarTokensPersona(tokens);
            } else {
              authService.saveTokens(tokens);
            }

            refreshTokenSubject.next(tokens.accessToken);

            return next(addToken(req, tokens.accessToken));
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshTokenSubject.next(null);

            clearSessionAndRedirect(
              isPersonaSession,
              authService,
              authPersona,
              router
            );

            return throwError(() => refreshError);
          })
        );
      }

      return refreshTokenSubject.pipe(
        filter((newToken): newToken is string => newToken !== null),
        take(1),
        switchMap((newToken) => {
          return next(addToken(req, newToken));
        })
      );
    })
  );
};

function addToken(req: any, token: string) {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function clearSessionAndRedirect(
  isPersonaSession: boolean,
  authService: AuthService,
  authPersona: AuthPersona,
  router: Router
): void {
  if (isPersonaSession) {
    authPersona.limpiarSesionPersona();
    router.navigateByUrl('/loginPersona');
    return;
  }

  authService.clearSession();
  router.navigateByUrl('/login');
}