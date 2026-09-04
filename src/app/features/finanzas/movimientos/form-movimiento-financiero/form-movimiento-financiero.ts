import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  finalize,
  forkJoin,
  map,
  Observable,
  of,
} from 'rxjs';

import {
  ActualizarIngresoRequest,
  EstadoIngreso,
  IngresoResponse,
  IngresoService,
  RegistrarIngresoRequest,
} from '../../../../core/services/finanzas/Ingreso/ingreso.service';

import {
  obtenerFechaHoyColombia
} from '../../../../core/utils/colombia-date.util';

import {
  ActualizarEgresoRequest,
  EgresoResponse,
  EgresoService,
  EstadoEgreso,
  RegistrarEgresoRequest,
} from '../../../../core/services/finanzas/egreso/egreso.service';

import {
  CategoriaIngresoService,
} from '../../../../core/services/finanzas/categoriaIngreso/categoria-ingreso.service';

import {
  CategoriaEgresoService,
} from '../../../../core/services/finanzas/categoriaEgreso/categoria-egreso.service';

export type TipoMovimientoFinanciero = 'ingreso' | 'egreso';

interface CategoriaMovimientoFinanciero {
  id: string;
  nombre: string;
}

interface OpcionEstadoMovimiento {
  valor: number;
  etiqueta: string;
}

interface MovimientoFinancieroFormModel {
  categoriaId: string;

  concepto: string;
  descripcion: string;

  valor: number | null;
  fecha: string;
  estado: number;

  observacion: string;

  metodoPago: string;
  referencia: string;

  proveedor: string;
  numeroFactura: string;
}

interface MovimientoFinancieroNormalizado {
  id: string;
  categoriaId: string;

  concepto: string;
  descripcion: string | null;

  valor: number;
  fecha: string;
  estado: number;

  observacion: string | null;

  metodoPago: string | null;
  referencia: string | null;

  proveedor: string | null;
  numeroFactura: string | null;

  anulado: boolean;
}

interface ConfiguracionMovimientoFinanciero {
  tituloRegistro: string;
  tituloEdicion: string;

  descripcionRegistro: string;
  descripcionEdicion: string;

  etiquetaFecha: string;
  etiquetaCategoria: string;

  placeholderConcepto: string;
  placeholderDescripcion: string;
  placeholderObservacion: string;

  textoBotonRegistro: string;
  textoBotonEdicion: string;

  mensajeRegistroExitoso: string;
  mensajeActualizacionExitosa: string;

  mensajeErrorCategorias: string;
  mensajeErrorDetalle: string;
  mensajeErrorRegistro: string;
  mensajeErrorActualizacion: string;
}

const CONFIGURACION_MOVIMIENTOS: Record<
  TipoMovimientoFinanciero,
  ConfiguracionMovimientoFinanciero
> = {
  ingreso: {
    tituloRegistro: 'Registrar ingreso',
    tituloEdicion: 'Editar ingreso',

    descripcionRegistro:
      'Registra una nueva entrada de dinero para mantener actualizada la información financiera.',
    descripcionEdicion:
      'Actualiza la información del ingreso seleccionado.',

    etiquetaFecha: 'Fecha del ingreso',
    etiquetaCategoria: 'Categoría de ingreso',

    placeholderConcepto: 'Ej. Pago de cuota de administración',
    placeholderDescripcion:
      'Agrega una descripción complementaria del ingreso',
    placeholderObservacion:
      'Agrega una observación interna sobre el ingreso',

    textoBotonRegistro: 'Registrar ingreso',
    textoBotonEdicion: 'Guardar cambios',

    mensajeRegistroExitoso:
      'El ingreso fue registrado correctamente.',
    mensajeActualizacionExitosa:
      'El ingreso fue actualizado correctamente.',

    mensajeErrorCategorias:
      'No fue posible cargar las categorías de ingreso.',
    mensajeErrorDetalle:
      'No fue posible cargar la información del ingreso.',
    mensajeErrorRegistro:
      'No fue posible registrar el ingreso.',
    mensajeErrorActualizacion:
      'No fue posible actualizar el ingreso.',
  },

  egreso: {
    tituloRegistro: 'Registrar egreso',
    tituloEdicion: 'Editar egreso',

    descripcionRegistro:
      'Registra una nueva salida de dinero para mantener actualizado el control financiero.',
    descripcionEdicion:
      'Actualiza la información del egreso seleccionado.',

    etiquetaFecha: 'Fecha del egreso',
    etiquetaCategoria: 'Categoría de egreso',

    placeholderConcepto: 'Ej. Reparación del sistema hidráulico',
    placeholderDescripcion:
      'Agrega una descripción complementaria del egreso',
    placeholderObservacion:
      'Agrega una observación interna sobre el egreso',

    textoBotonRegistro: 'Registrar egreso',
    textoBotonEdicion: 'Guardar cambios',

    mensajeRegistroExitoso:
      'El egreso fue registrado correctamente.',
    mensajeActualizacionExitosa:
      'El egreso fue actualizado correctamente.',

    mensajeErrorCategorias:
      'No fue posible cargar las categorías de egreso.',
    mensajeErrorDetalle:
      'No fue posible cargar la información del egreso.',
    mensajeErrorRegistro:
      'No fue posible registrar el egreso.',
    mensajeErrorActualizacion:
      'No fue posible actualizar el egreso.',
  },
};

@Component({
  selector: 'app-form-movimiento-financiero',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './form-movimiento-financiero.html',
  styleUrl: './form-movimiento-financiero.css',
})
export class FormMovimientoFinanciero
  implements OnInit, OnChanges {

  @Input({ required: true })
  tipo: TipoMovimientoFinanciero = 'ingreso';

  @Input()
  movimientoId: string | null = null;

  @Output()
  guardado = new EventEmitter<void>();

  @Output()
  cerrar = new EventEmitter<void>();

  categorias: CategoriaMovimientoFinanciero[] = [];

  form: MovimientoFinancieroFormModel =
    this.crearFormularioVacio();

  isLoading = false;
  isSubmitting = false;

  hasErrors = false;
  errorMessage = '';
  successMessage = '';

  private inicializado = false;

  constructor(
    private readonly ingresoService: IngresoService,
    private readonly egresoService: EgresoService,
    private readonly categoriaIngresoService: CategoriaIngresoService,
    private readonly categoriaEgresoService: CategoriaEgresoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get configuracion(): ConfiguracionMovimientoFinanciero {
    return CONFIGURACION_MOVIMIENTOS[this.tipo];
  }

  get esEdicion(): boolean {
    return Boolean(this.movimientoId);
  }

  get tituloFormulario(): string {
    return this.esEdicion
      ? this.configuracion.tituloEdicion
      : this.configuracion.tituloRegistro;
  }

  get descripcionFormulario(): string {
    return this.esEdicion
      ? this.configuracion.descripcionEdicion
      : this.configuracion.descripcionRegistro;
  }

  get textoBotonGuardar(): string {
    return this.esEdicion
      ? this.configuracion.textoBotonEdicion
      : this.configuracion.textoBotonRegistro;
  }

  get estadosDisponibles(): OpcionEstadoMovimiento[] {
    if (this.tipo === 'ingreso') {
      return [
        {
          valor: EstadoIngreso.Pendiente,
          etiqueta: 'Pendiente',
        },
        {
          valor: EstadoIngreso.Pagado,
          etiqueta: 'Pagado',
        },
      ];
    }

    return [
      {
        valor: EstadoEgreso.Registrado,
        etiqueta: 'Registrado',
      },
      {
        valor: EstadoEgreso.Pagado,
        etiqueta: 'Pagado',
      },
    ];
  }

  ngOnInit(): void {
    this.inicializado = true;
    this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.inicializado) {
      return;
    }

    const cambioTipo =
      changes['tipo'] &&
      !changes['tipo'].firstChange;

    const cambioMovimiento =
      changes['movimientoId'] &&
      !changes['movimientoId'].firstChange;

    if (cambioTipo || cambioMovimiento) {
      this.reiniciarComponente();
      this.cargar();
    }
  }

  cargar(): void {
    if (this.isLoading || this.isSubmitting) {
      return;
    }

    this.isLoading = true;
    this.limpiarMensajes();

    const detalle$ = this.movimientoId
      ? this.obtenerMovimientoNormalizado(this.movimientoId)
      : of(null);

    forkJoin({
      categorias: this.obtenerCategoriasActivas(),
      movimiento: detalle$,
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ categorias, movimiento }) => {
          this.categorias = categorias;

          if (movimiento) {
            if (movimiento.anulado) {
              this.hasErrors = true;
              this.errorMessage =
                'Un movimiento anulado no puede ser modificado.';
            }

            this.cargarMovimientoEnFormulario(movimiento);
            return;
          }

          this.form = this.crearFormularioVacio();
        },
        error: (error) => {
          this.categorias = [];

          const mensaje = this.movimientoId
            ? this.configuracion.mensajeErrorDetalle
            : this.configuracion.mensajeErrorCategorias;

          this.mostrarError(error, mensaje);
        },
      });
  }

  guardar(): void {
    if (this.isSubmitting || this.isLoading) {
      return;
    }

    this.limpiarMensajes();

    if (!this.validarFormulario()) {
      return;
    }

    this.isSubmitting = true;

    if (this.tipo === 'ingreso') {
      this.guardarIngreso();
      return;
    }

    this.guardarEgreso();
  }

  solicitarCierre(): void {
    if (this.isSubmitting) {
      return;
    }

    this.cerrar.emit();
  }

  limpiarFormulario(): void {
    if (this.isSubmitting) {
      return;
    }

    this.form = this.crearFormularioVacio();
    this.limpiarMensajes();
  }

  private guardarIngreso(): void {
    const request = this.construirIngresoRequest();

    const operacion$: Observable<IngresoResponse> =
      this.movimientoId
        ? this.ingresoService.actualizar(
            this.movimientoId,
            request
          )
        : this.ingresoService.registrar(request);

    operacion$
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = this.movimientoId
            ? this.configuracion.mensajeActualizacionExitosa
            : this.configuracion.mensajeRegistroExitoso;

          this.guardado.emit();
        },
        error: (error) => {
          this.mostrarError(
            error,
            this.movimientoId
              ? this.configuracion.mensajeErrorActualizacion
              : this.configuracion.mensajeErrorRegistro
          );
        },
      });
  }

  private guardarEgreso(): void {
    const request = this.construirEgresoRequest();

    const operacion$: Observable<EgresoResponse> =
      this.movimientoId
        ? this.egresoService.actualizar(
            this.movimientoId,
            request
          )
        : this.egresoService.registrar(request);

    operacion$
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = this.movimientoId
            ? this.configuracion.mensajeActualizacionExitosa
            : this.configuracion.mensajeRegistroExitoso;

          this.guardado.emit();
        },
        error: (error) => {
          this.mostrarError(
            error,
            this.movimientoId
              ? this.configuracion.mensajeErrorActualizacion
              : this.configuracion.mensajeErrorRegistro
          );
        },
      });
  }

  private construirIngresoRequest():
    RegistrarIngresoRequest | ActualizarIngresoRequest {

    return {
      categoriaIngresoId: this.form.categoriaId,
      concepto: this.form.concepto.trim(),
      descripcion: this.normalizarTexto(this.form.descripcion),

      valor: Number(this.form.valor),
      fechaIngreso: this.form.fecha,

      estado: this.form.estado as EstadoIngreso,

      metodoPago: this.normalizarTexto(this.form.metodoPago),
      referencia: this.normalizarTexto(this.form.referencia),

      observacion: this.normalizarTexto(this.form.observacion),
    };
  }

  private construirEgresoRequest():
    RegistrarEgresoRequest | ActualizarEgresoRequest {

    return {
      categoriaEgresoId: this.form.categoriaId,
      concepto: this.form.concepto.trim(),
      descripcion: this.normalizarTexto(this.form.descripcion),

      valor: Number(this.form.valor),
      fechaEgreso: this.form.fecha,

      estado: this.form.estado as EstadoEgreso,

      proveedor: this.normalizarTexto(this.form.proveedor),
      numeroFactura: this.normalizarTexto(
        this.form.numeroFactura
      ),

      observacion: this.normalizarTexto(this.form.observacion),
    };
  }

  private obtenerCategoriasActivas(): Observable<
    CategoriaMovimientoFinanciero[]
  > {
    if (this.tipo === 'ingreso') {
      return this.categoriaIngresoService
        .obtenerActivas()
        .pipe(
          map((categorias) =>
            categorias.map((categoria) => ({
              id: categoria.id,
              nombre: categoria.nombre,
            }))
          )
        );
    }

    return this.categoriaEgresoService
      .obtenerActivas()
      .pipe(
        map((categorias) =>
          categorias.map((categoria) => ({
            id: categoria.id,
            nombre: categoria.nombre,
          }))
        )
      );
  }

  private obtenerMovimientoNormalizado(
    id: string
  ): Observable<MovimientoFinancieroNormalizado> {
    if (this.tipo === 'ingreso') {
      return this.ingresoService
        .obtenerPorId(id)
        .pipe(
          map((movimiento) =>
            this.normalizarIngreso(movimiento)
          )
        );
    }

    return this.egresoService
      .obtenerPorId(id)
      .pipe(
        map((movimiento) =>
          this.normalizarEgreso(movimiento)
        )
      );
  }

  private normalizarIngreso(
    movimiento: IngresoResponse
  ): MovimientoFinancieroNormalizado {
    return {
      id: movimiento.id,
      categoriaId: movimiento.categoriaIngresoId,

      concepto: movimiento.concepto,
      descripcion: movimiento.descripcion,

      valor: movimiento.valor,
      fecha: movimiento.fechaIngreso,
      estado: this.mapearEstadoIngreso(movimiento.estado),

      observacion: movimiento.observacion,

      metodoPago: movimiento.metodoPago,
      referencia: movimiento.referencia,

      proveedor: null,
      numeroFactura: null,

      anulado:
        movimiento.estado.trim().toLowerCase() === 'anulado',
    };
  }

  private normalizarEgreso(
    movimiento: EgresoResponse
  ): MovimientoFinancieroNormalizado {
    return {
      id: movimiento.id,
      categoriaId: movimiento.categoriaEgresoId,

      concepto: movimiento.concepto,
      descripcion: movimiento.descripcion,

      valor: movimiento.valor,
      fecha: movimiento.fechaEgreso,
      estado: this.mapearEstadoEgreso(movimiento.estado),

      observacion: movimiento.observacion,

      metodoPago: null,
      referencia: null,

      proveedor: movimiento.proveedor,
      numeroFactura: movimiento.numeroFactura,

      anulado:
        movimiento.estado.trim().toLowerCase() === 'anulado',
    };
  }

  private cargarMovimientoEnFormulario(
    movimiento: MovimientoFinancieroNormalizado
  ): void {
    this.form = {
      categoriaId: movimiento.categoriaId,

      concepto: movimiento.concepto,
      descripcion: movimiento.descripcion ?? '',

      valor: movimiento.valor,
      fecha: this.convertirFechaParaInput(movimiento.fecha),
      estado: movimiento.estado,

      observacion: movimiento.observacion ?? '',

      metodoPago: movimiento.metodoPago ?? '',
      referencia: movimiento.referencia ?? '',

      proveedor: movimiento.proveedor ?? '',
      numeroFactura: movimiento.numeroFactura ?? '',
    };
  }

  private validarFormulario(): boolean {
    const categoriaId = this.form.categoriaId.trim();
    const concepto = this.form.concepto.trim();
    const descripcion = this.form.descripcion.trim();
    const observacion = this.form.observacion.trim();

    if (!categoriaId) {
      this.mostrarValidacion(
        'Debes seleccionar una categoría.'
      );
      return false;
    }

    if (!concepto) {
      this.mostrarValidacion(
        'El concepto del movimiento es obligatorio.'
      );
      return false;
    }

    if (concepto.length < 2) {
      this.mostrarValidacion(
        'El concepto debe tener al menos 2 caracteres.'
      );
      return false;
    }

    if (concepto.length > 150) {
      this.mostrarValidacion(
        'El concepto no puede superar los 150 caracteres.'
      );
      return false;
    }

    if (
      this.form.valor === null ||
      !Number.isFinite(Number(this.form.valor)) ||
      Number(this.form.valor) <= 0
    ) {
      this.mostrarValidacion(
        'El valor debe ser mayor que cero.'
      );
      return false;
    }

    if (!this.form.fecha) {
      this.mostrarValidacion(
        'La fecha del movimiento es obligatoria.'
      );
      return false;
    }

    if (!this.estadosDisponibles.some(
      (estado) => estado.valor === Number(this.form.estado)
    )) {
      this.mostrarValidacion(
        'El estado seleccionado no es válido.'
      );
      return false;
    }

    if (descripcion.length > 500) {
      this.mostrarValidacion(
        'La descripción no puede superar los 500 caracteres.'
      );
      return false;
    }

    if (observacion.length > 500) {
      this.mostrarValidacion(
        'La observación no puede superar los 500 caracteres.'
      );
      return false;
    }

    return true;
  }

  private mapearEstadoIngreso(
    estado: string
  ): EstadoIngreso {
    switch (estado.trim().toLowerCase()) {
      case 'pagado':
        return EstadoIngreso.Pagado;

      case 'anulado':
        return EstadoIngreso.Anulado;

      default:
        return EstadoIngreso.Pendiente;
    }
  }

  private mapearEstadoEgreso(
    estado: string
  ): EstadoEgreso {
    switch (estado.trim().toLowerCase()) {
      case 'pagado':
        return EstadoEgreso.Pagado;

      case 'anulado':
        return EstadoEgreso.Anulado;

      default:
        return EstadoEgreso.Registrado;
    }
  }

  private crearFormularioVacio():
    MovimientoFinancieroFormModel {

    return {
      categoriaId: '',

      concepto: '',
      descripcion: '',

      valor: null,
      fecha: this.obtenerFechaActual(),
      estado: this.obtenerEstadoInicial(),

      observacion: '',

      metodoPago: '',
      referencia: '',

      proveedor: '',
      numeroFactura: '',
    };
  }

  private obtenerEstadoInicial(): number {
    return this.tipo === 'ingreso'
      ? EstadoIngreso.Pendiente
      : EstadoEgreso.Registrado;
  }

  private obtenerFechaActual(): string {
    return obtenerFechaHoyColombia();
  }

  private convertirFechaParaInput(
    fecha: string
  ): string {
    if (!fecha) {
      return '';
    }

    return fecha.substring(0, 10);
  }

  private normalizarTexto(
    valor: string
  ): string | null {
    const texto = valor.trim();
    return texto || null;
  }

  private reiniciarComponente(): void {
    this.form = this.crearFormularioVacio();
    this.categorias = [];

    this.isLoading = false;
    this.isSubmitting = false;

    this.limpiarMensajes();
  }

  private limpiarMensajes(): void {
    this.hasErrors = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  private mostrarValidacion(mensaje: string): void {
    this.hasErrors = true;
    this.errorMessage = mensaje;
    this.successMessage = '';
  }

  private mostrarError(
    error: any,
    mensajePredeterminado: string
  ): void {
    this.hasErrors = true;
    this.successMessage = '';

    this.errorMessage =
      error?.error?.message ||
      error?.error?.mensaje ||
      error?.error?.title ||
      (typeof error?.error === 'string'
        ? error.error
        : null) ||
      mensajePredeterminado;
  }
}