import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';

import {
  ActualizarPerfilUsuarioRequest,
  AuthService,
  PerfilUsuarioResponse,
} from '../../../../core/services/auth/auth';

@Component({
  selector: 'app-form-perfil-usuario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-perfil-usuario.html',
  styleUrl: './form-perfil-usuario.css',
})
export class FormPerfilUsuarioComponent
  implements OnChanges, OnDestroy {

  @Input({ required: true })
  perfil: PerfilUsuarioResponse | null = null;

  @Output()
  cerrar = new EventEmitter<void>();

  @Output()
  perfilActualizado =
    new EventEmitter<PerfilUsuarioResponse>();

  private readonly apiBaseUrl =
    'https://localhost:7232';

  private readonly tiposImagenPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly tamanoMaximoFoto =
    5 * 1024 * 1024;

  /* =========================================================
     DATOS DEL ADMINISTRADOR
     ========================================================= */

  nombre = '';
  documento = '';
  telefono = '';
  email = '';

  /* =========================================================
     DATOS DEL TENANT
     ========================================================= */

  nombreEmpresa = '';
  nit = '';
  dominio = '';
  direccion = '';
  ciudad = '';
  telefonoEmpresa = '';
  emailContacto = '';
  tipoPropiedad = '';

  cantidadTorres: number | null = null;
  cantidadApartamentos: number | null = null;

  /* =========================================================
     FOTOGRAFÍA
     ========================================================= */

  fotoSeleccionada: File | null = null;
  fotoPreview: string | null = null;
  fotoActualUrl: string | null = null;
  fotoNoDisponible = false;

  /* =========================================================
     ESTADOS
     ========================================================= */

  isSubmitting = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['perfil'] &&
      this.perfil
    ) {
      this.cargarDatosPerfil(this.perfil);
    }
  }

  ngOnDestroy(): void {
    this.liberarFotoPreview();
  }

  /* =========================================================
     FOTOGRAFÍA
     ========================================================= */

  seleccionarFoto(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.item(0) ?? null;

    this.limpiarMensajes();

    if (!archivo) {
      return;
    }

    if (
      !this.tiposImagenPermitidos.includes(
        archivo.type
      )
    ) {
      input.value = '';

      this.errorMessage =
        'La fotografía debe estar en formato JPG, PNG o WebP.';

      return;
    }

    if (
      archivo.size >
      this.tamanoMaximoFoto
    ) {
      input.value = '';

      this.errorMessage =
        'La fotografía no puede superar los 5 MB.';

      return;
    }

    this.liberarFotoPreview();

    this.fotoSeleccionada = archivo;
    this.fotoPreview =
      URL.createObjectURL(archivo);

    this.fotoNoDisponible = false;
  }

  quitarFotoSeleccionada(
    inputFoto?: HTMLInputElement
  ): void {
    if (this.isSubmitting) {
      return;
    }

    this.liberarFotoPreview();

    this.fotoSeleccionada = null;
    this.fotoPreview = null;
    this.fotoNoDisponible = false;

    if (inputFoto) {
      inputFoto.value = '';
    }
  }

  obtenerFotoVisible(): string | null {
    if (this.fotoNoDisponible) {
      return null;
    }

    return (
      this.fotoPreview ??
      this.fotoActualUrl
    );
  }

  manejarErrorFoto(): void {
    this.fotoNoDisponible = true;
  }

  obtenerIniciales(): string {
    const nombreNormalizado =
      this.nombre.trim();

    if (!nombreNormalizado) {
      return 'AD';
    }

    const partes = nombreNormalizado
      .split(/\s+/)
      .filter(parte => parte.length > 0);

    if (partes.length === 1) {
      return partes[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return `${partes[0][0]}${partes[1][0]}`
      .toUpperCase();
  }

  /* =========================================================
     GUARDAR
     ========================================================= */

  guardar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarMensajes();

    const mensajeValidacion =
      this.validarFormulario();

    if (mensajeValidacion) {
      this.errorMessage =
        mensajeValidacion;

      return;
    }

    const request:
      ActualizarPerfilUsuarioRequest = {
        nombre: this.nombre.trim(),
        documento: this.documento.trim(),
        telefono: this.telefono.trim(),
        email: this.email
          .trim()
          .toLowerCase(),

        nombreEmpresa:
          this.nombreEmpresa.trim(),

        nit: this.nit.trim(),

        dominio: this.dominio
          .trim()
          .toLowerCase(),

        direccion: this.direccion.trim(),
        ciudad: this.ciudad.trim(),

        telefonoEmpresa:
          this.telefonoEmpresa.trim(),

        emailContacto:
          this.emailContacto
            .trim()
            .toLowerCase(),

        tipoPropiedad:
          this.tipoPropiedad.trim(),

        cantidadTorres:
          this.normalizarNumeroOpcional(
            this.cantidadTorres
          ),

        cantidadApartamentos:
          this.normalizarNumeroOpcional(
            this.cantidadApartamentos
          ),

        foto: this.fotoSeleccionada,
      };

    this.isSubmitting = true;

    this.authService
      .actualizarPerfil(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: perfilActualizado => {
          this.successMessage =
            'El perfil fue actualizado correctamente.';

          this.liberarFotoPreview();

          this.fotoSeleccionada = null;
          this.fotoPreview = null;

          this.cargarDatosPerfil(
            perfilActualizado
          );

          this.perfilActualizado.emit(
            perfilActualizado
          );
        },
        error: error => {
          console.error(
            'Error actualizando el perfil del administrador:',
            error
          );

          this.errorMessage =
            this.obtenerMensajeError(error);
        },
      });
  }

  cancelar(): void {
    if (this.isSubmitting) {
      return;
    }

    this.liberarFotoPreview();
    this.cerrar.emit();
  }

  cerrarError(): void {
    this.errorMessage = '';
  }

  cerrarExito(): void {
    this.successMessage = '';
  }

  /* =========================================================
     CARGA DE DATOS
     ========================================================= */

  private cargarDatosPerfil(
    perfil: PerfilUsuarioResponse
  ): void {
    this.nombre =
      perfil.nombre ?? '';

    this.documento =
      perfil.documento ?? '';

    this.telefono =
      perfil.telefono ?? '';

    this.email =
      perfil.email ?? '';

    this.nombreEmpresa =
      perfil.nombreEmpresa ?? '';

    this.nit =
      perfil.nit ?? '';

    this.dominio =
      perfil.dominio ?? '';

    this.direccion =
      perfil.direccion ?? '';

    this.ciudad =
      perfil.ciudad ?? '';

    this.telefonoEmpresa =
      perfil.telefonoEmpresa ?? '';

    this.emailContacto =
      perfil.emailContacto ?? '';

    this.tipoPropiedad =
      perfil.tipoPropiedad ?? '';

    this.cantidadTorres =
      perfil.cantidadTorres ?? null;

    this.cantidadApartamentos =
      perfil.cantidadApartamentos ?? null;

    this.liberarFotoPreview();

    this.fotoSeleccionada = null;
    this.fotoPreview = null;
    this.fotoNoDisponible = false;

    this.fotoActualUrl =
      this.construirFotoUrl(
        perfil.fotoUrl
      );

    this.limpiarMensajes();
  }

  /* =========================================================
     VALIDACIONES
     ========================================================= */

  private validarFormulario(): string {
    const nombre =
      this.nombre.trim();

    const documento =
      this.documento.trim();

    const telefono =
      this.telefono.trim();

    const email =
      this.email.trim();

    const nombreEmpresa =
      this.nombreEmpresa.trim();

    const nit =
      this.nit.trim();

    const dominio =
      this.dominio.trim();

    const direccion =
      this.direccion.trim();

    const ciudad =
      this.ciudad.trim();

    const telefonoEmpresa =
      this.telefonoEmpresa.trim();

    const emailContacto =
      this.emailContacto.trim();

    const tipoPropiedad =
      this.tipoPropiedad.trim();

    if (!nombre) {
      return 'El nombre del administrador es obligatorio.';
    }

    if (nombre.length > 150) {
      return 'El nombre del administrador no puede superar los 150 caracteres.';
    }

    if (!documento) {
      return 'El documento del administrador es obligatorio.';
    }

    if (documento.length > 50) {
      return 'El documento no puede superar los 50 caracteres.';
    }

    if (!telefono) {
      return 'El teléfono del administrador es obligatorio.';
    }

    if (telefono.length > 30) {
      return 'El teléfono del administrador no puede superar los 30 caracteres.';
    }

    if (!email) {
      return 'El correo electrónico del administrador es obligatorio.';
    }

    if (!this.esEmailValido(email)) {
      return 'El correo electrónico del administrador no es válido.';
    }

    if (email.length > 150) {
      return 'El correo electrónico del administrador no puede superar los 150 caracteres.';
    }

    if (!nombreEmpresa) {
      return 'El nombre de la residencia es obligatorio.';
    }

    if (nombreEmpresa.length > 150) {
      return 'El nombre de la residencia no puede superar los 150 caracteres.';
    }

    if (!nit) {
      return 'El NIT es obligatorio.';
    }

    if (nit.length > 30) {
      return 'El NIT no puede superar los 30 caracteres.';
    }

    if (!dominio) {
      return 'El dominio es obligatorio.';
    }

    if (dominio.length > 150) {
      return 'El dominio no puede superar los 150 caracteres.';
    }

    if (!direccion) {
      return 'La dirección de la residencia es obligatoria.';
    }

    if (direccion.length > 250) {
      return 'La dirección no puede superar los 250 caracteres.';
    }

    if (!ciudad) {
      return 'La ciudad es obligatoria.';
    }

    if (ciudad.length > 100) {
      return 'La ciudad no puede superar los 100 caracteres.';
    }

    if (!telefonoEmpresa) {
      return 'El teléfono de la residencia es obligatorio.';
    }

    if (telefonoEmpresa.length > 30) {
      return 'El teléfono de la residencia no puede superar los 30 caracteres.';
    }

    if (!emailContacto) {
      return 'El correo de contacto de la residencia es obligatorio.';
    }

    if (
      !this.esEmailValido(
        emailContacto
      )
    ) {
      return 'El correo de contacto de la residencia no es válido.';
    }

    if (emailContacto.length > 150) {
      return 'El correo de contacto no puede superar los 150 caracteres.';
    }

    if (!tipoPropiedad) {
      return 'El tipo de propiedad es obligatorio.';
    }

    if (tipoPropiedad.length > 80) {
      return 'El tipo de propiedad no puede superar los 80 caracteres.';
    }

    if (
      this.cantidadTorres !== null &&
      (
        !Number.isInteger(
          Number(this.cantidadTorres)
        ) ||
        Number(this.cantidadTorres) < 0
      )
    ) {
      return 'La cantidad de torres debe ser un número entero igual o mayor que cero.';
    }

    if (
      this.cantidadApartamentos !== null &&
      (
        !Number.isInteger(
          Number(
            this.cantidadApartamentos
          )
        ) ||
        Number(
          this.cantidadApartamentos
        ) < 0
      )
    ) {
      return 'La cantidad de apartamentos debe ser un número entero igual o mayor que cero.';
    }

    if (
      this.fotoSeleccionada &&
      !this.tiposImagenPermitidos.includes(
        this.fotoSeleccionada.type
      )
    ) {
      return 'La fotografía debe estar en formato JPG, PNG o WebP.';
    }

    if (
      this.fotoSeleccionada &&
      this.fotoSeleccionada.size >
        this.tamanoMaximoFoto
    ) {
      return 'La fotografía no puede superar los 5 MB.';
    }

    return '';
  }

  private esEmailValido(
    email: string
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }

  private normalizarNumeroOpcional(
    valor: number | null
  ): number | null {
    if (
      valor === null ||
      valor === undefined ||
      valor === ('' as unknown as number)
    ) {
      return null;
    }

    return Number(valor);
  }

  /* =========================================================
     URL DE LA FOTOGRAFÍA
     ========================================================= */

  private construirFotoUrl(
    fotoUrl: string | null
  ): string | null {
    if (!fotoUrl) {
      return null;
    }

    const ruta = fotoUrl.trim();

    if (!ruta) {
      return null;
    }

    if (
      ruta.startsWith('http://') ||
      ruta.startsWith('https://') ||
      ruta.startsWith('data:') ||
      ruta.startsWith('blob:')
    ) {
      return ruta;
    }

    const rutaNormalizada =
      ruta.startsWith('/')
        ? ruta
        : `/${ruta}`;

    return `${this.apiBaseUrl}${rutaNormalizada}`;
  }

  private liberarFotoPreview(): void {
    if (
      this.fotoPreview?.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        this.fotoPreview
      );
    }
  }

  /* =========================================================
     MENSAJES DEL BACKEND
     ========================================================= */

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private obtenerMensajeError(
    error: any
  ): string {
    const backendMessage =
      error?.error?.message ??
      error?.error?.mensaje ??
      error?.error?.title;

    if (
      typeof backendMessage ===
        'string' &&
      backendMessage.trim()
    ) {
      return backendMessage;
    }

    const validationErrors =
      error?.error?.errors;

    if (
      validationErrors &&
      typeof validationErrors === 'object'
    ) {
      const firstValidationError =
        Object.values(validationErrors)
          .flat()
          .find(
            message =>
              typeof message ===
                'string' &&
              message.trim().length > 0
          );

      if (
        typeof firstValidationError ===
        'string'
      ) {
        return firstValidationError;
      }
    }

    switch (error?.status) {
      case 0:
        return 'No fue posible conectarse con el servidor. Verifica que la API esté disponible.';

      case 400:
        return 'La información enviada no es válida. Revisa los campos del formulario.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para actualizar este perfil.';

      case 404:
        return 'No se encontró la información del administrador o de la residencia.';

      case 409:
        return 'El correo, documento, dominio o NIT ya se encuentra registrado.';

      case 413:
        return 'La fotografía enviada supera el tamaño permitido.';

      case 415:
        return 'El formato de la fotografía no es compatible.';

      case 500:
        return 'Ocurrió un error interno al actualizar el perfil.';

      default:
        return 'No fue posible actualizar el perfil.';
    }
  }
}