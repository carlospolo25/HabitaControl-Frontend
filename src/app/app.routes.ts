import { Routes } from '@angular/router';

import { authGuardGuard } from '././core/guards/admin/auth-guard-guard';
import { noAuthGuard } from './core/guards/admin/no-auth-guard';
import { personaAuthGuard } from '././core/guards/persona/persona-auth-guard';
import { noPersonaAuthGuard } from '././core/guards/persona/no-persona-auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home/home')
        .then(m => m.HomeComponent),
  },

  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/pages/login/login')
        .then(m => m.LoginComponent),
  },

  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/pages/register/register')
        .then(m => m.RegisterComponent),
  },
  
  {
    path: 'solicitar-recuperacion',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/recupera-contrasena/solicitar-recuperacion-contrasena/solicitar-recuperacion-contrasena')
        .then(m => m.SolicitarRecuperacionContrasena),
  },

  {
    path: 'restablecer-contrasena',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/recupera-contrasena/restablecer-contrasena/restablecer-contrasena')
        .then(m => m.RestablecerContrasena),
  },

  {
    path: 'seguridad/cerrar-sesiones',
    loadComponent: () =>
      import('./features/seguridad/cerrar-sesiones/cerrar-sesiones')
        .then(m => m.CerrarSesionesComponent),
  },

  {
    path: 'dashboard',
    canActivate: [authGuardGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard')
        .then(m => m.DashboardPage),
  },

  {
    path: 'loginPersona',
    canActivate: [noPersonaAuthGuard],
    loadComponent: () =>
      import('./features/authPersona/login/login')
        .then(m => m.Login),
  },

  {
    path: 'registroPersona',
    loadComponent: () =>
      import('./features/authPersona/register/register')
        .then(m => m.RegisterPersonaComponent),
  },

  {
    path: 'dashboard-persona',
    canActivate: [personaAuthGuard],
    loadComponent: () =>
      import('./features/persona/dashboard-persona/dashboard-persona')
        .then(m => m.DashboardPersona),
  },

  {
    path: '**',
    redirectTo: '',
  },
];