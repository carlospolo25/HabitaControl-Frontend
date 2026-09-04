import { inject } from '@angular/core';

import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';

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

import {
  AuthPersona,
} from '../services/authPersona/auth-persona';

import {
  CsrfService,
} from '../services/csrf/csrf.service';

import {
  AuthSessionContext,
  IdentityType,
} from '../Auth/auth-session-context';

import {
  SKIP_AUTH_REFRESH,
} from '../Auth/auth-http-context';


type RefreshState = {
  type: IdentityType;
};


let isRefreshing = false;


const refreshTokenSubject =
  new BehaviorSubject<RefreshState | null>(
    null
  );


export const authInterceptor:
  HttpInterceptorFn = (
    req,
    next
  ) => {

    const authService =
      inject(AuthService);

    const authPersona =
      inject(AuthPersona);

    const csrfService =
      inject(CsrfService);

    const sessionContext =
      inject(AuthSessionContext);

    const router =
      inject(Router);


    // ==========================================
    // COOKIES
    // ==========================================

    /*
     * Todas las solicitudes hacia nuestra API
     * pueden transportar cookies HttpOnly.
     */
    req = req.clone({
      withCredentials: true,
    });


    // ==========================================
    // CSRF
    // ==========================================

    /*
     * Solo los métodos que pueden modificar
     * estado necesitan protección CSRF.
     */
    const requiereCsrf =
      req.method === 'POST' ||
      req.method === 'PUT' ||
      req.method === 'PATCH' ||
      req.method === 'DELETE';


    /*
     * Ejecutamos la solicitud después de que,
     * si corresponde, tenga agregado el
     * X-CSRF-TOKEN.
     */
    const ejecutarSolicitud = () => {

      /*
       * Estas rutas no deben iniciar otro
       * refresh si ellas mismas responden 401.
       *
       * IMPORTANTE:
       * Esto NO significa que estén exentas
       * de CSRF.
       */
      const skipRefreshRoute =
        req.url.includes(
          'validar-invitacion-persona'
        ) ||
        req.url.includes(
          'validate-invitacion'
        ) ||
        req.url.includes(
          'completar-registro'
        ) ||
        req.url.includes(
          '/auth/login'
        ) ||
        req.url.includes(
          '/auth/refresh'
        ) ||
        req.url.includes(
          '/auth/logout'
        ) ||
        req.url.includes(
          '/authPersona/login-persona'
        ) ||
        req.url.includes(
          '/authPersona/refresh'
        ) ||
        req.url.includes(
          '/authPersona/logout'
        ) ||
        req.url.includes(
          '/Seguridad/cerrar-sesiones'
        );


      if (skipRefreshRoute) {
        return next(req);
      }


      const skipAuthRefresh =
        req.context.get(
          SKIP_AUTH_REFRESH
        );


      /*
       * No consultamos AccessToken
       * ni RefreshToken.
       *
       * Solo sabemos qué identidad
       * está utilizando esta pestaña.
       */
      const identityType =
        sessionContext
          .getIdentityType();


      return next(req)
        .pipe(
          catchError(
            (
              error:
                HttpErrorResponse
            ) => {

              if (
                error.status !== 401
              ) {
                return throwError(
                  () => error
                );
              }


              /*
               * Esta solicitud únicamente
               * comprueba si existe una
               * sesión válida.
               *
               * No hacemos refresh.
               * No redireccionamos.
               */
              if (skipAuthRefresh) {
                return throwError(
                  () => error
                );
              }


              /*
               * No conocemos qué identidad
               * está activa.
               *
               * No podemos decidir entre
               * Admin o Persona.
               */
              if (!identityType) {
                return throwError(
                  () => error
                );
              }


              /*
               * Si no existe otro refresh,
               * esta petición será la
               * responsable.
               */
              if (!isRefreshing) {

                isRefreshing = true;

                refreshTokenSubject
                  .next(null);


                // ==================================
                // PERSONA
                // ==================================

                if (
                  identityType ===
                  'persona'
                ) {

                  return authPersona
                    .refreshTokenPersona()
                    .pipe(

                      switchMap(() => {

                        isRefreshing =
                          false;

                        refreshTokenSubject
                          .next({
                            type:
                              'persona',
                          });


                        /*
                         * La nueva cookie
                         * Persona.Access ya fue
                         * instalada por Set-Cookie.
                         *
                         * Reintentamos la
                         * solicitud original.
                         */
                        return next(req);
                      }),


                      catchError(
                        (
                          refreshError
                        ) => {

                          isRefreshing =
                            false;

                          refreshTokenSubject
                            .next(null);


                          clearSessionAndRedirect(
                            'persona',
                            sessionContext,
                            router
                          );


                          return throwError(
                            () =>
                              refreshError
                          );
                        }
                      )
                    );
                }


                // ==================================
                // ADMIN
                // ==================================

                return authService
                  .refreshToken()
                  .pipe(

                    switchMap(() => {

                      isRefreshing =
                        false;

                      refreshTokenSubject
                        .next({
                          type:
                            'admin',
                        });


                      /*
                       * La nueva cookie
                       * Admin.Access ya fue
                       * instalada.
                       */
                      return next(req);
                    }),


                    catchError(
                      (
                        refreshError
                      ) => {

                        isRefreshing =
                          false;

                        refreshTokenSubject
                          .next(null);


                        clearSessionAndRedirect(
                          'admin',
                          sessionContext,
                          router
                        );


                        return throwError(
                          () =>
                            refreshError
                        );
                      }
                    )
                  );
              }


              /*
               * Ya existe otro refresh.
               *
               * Esperamos a que termine.
               */
              return refreshTokenSubject
                .pipe(

                  filter(
                    (
                      state
                    ): state is
                      RefreshState =>
                        state !== null
                  ),


                  take(1),


                  switchMap(
                    (state) => {

                      /*
                       * Verificamos que
                       * el refresh corresponda
                       * a nuestra identidad.
                       */
                      if (
                        state.type !==
                        identityType
                      ) {
                        return throwError(
                          () =>
                            new Error(
                              'El contexto de identidad cambió durante la renovación.'
                            )
                        );
                      }


                      /*
                       * No añadimos
                       * Authorization Bearer.
                       *
                       * La nueva Access Cookie
                       * viajará automáticamente.
                       */
                      return next(req);
                    }
                  )
                );
            }
          )
        );
    };


    // ==========================================
    // PETICIÓN SEGURA: GET / HEAD / OPTIONS
    // ==========================================

    if (!requiereCsrf) {
      return ejecutarSolicitud();
    }


    // ==========================================
    // PETICIÓN MUTABLE
    // POST / PUT / PATCH / DELETE
    // ==========================================

    return csrfService
      .obtenerToken()
      .pipe(
        switchMap(
          (csrfToken) => {

            req = req.clone({
              setHeaders: {
                'X-CSRF-TOKEN':
                  csrfToken,
              },
            });


            return ejecutarSolicitud();
          }
        )
      );
  };


function clearSessionAndRedirect(
  identityType: IdentityType,
  sessionContext:
    AuthSessionContext,
  router: Router
): void {

  sessionContext.clear();


  if (
    identityType ===
    'persona'
  ) {
    router.navigateByUrl(
      '/loginPersona'
    );

    return;
  }


  router.navigateByUrl(
    '/login'
  );
}