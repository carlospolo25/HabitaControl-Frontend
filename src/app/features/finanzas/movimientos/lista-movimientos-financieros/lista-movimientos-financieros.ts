import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, map, Observable } from 'rxjs';

import {
  IngresoResponse,
  IngresoService,
} from '../../../../core/services/finanzas/Ingreso/ingreso.service';

import {
  EgresoResponse,
  EgresoService,
} from '../../../../core/services/finanzas/egreso/egreso.service';

import {
  FormMovimientoFinanciero,
  TipoMovimientoFinanciero,
} from '../form-movimiento-financiero/form-movimiento-financiero';

import {
  obtenerAnioActualColombia,
  obtenerMesActualColombia,
} from '../../../../core/utils/colombia-date.util';

type TipoConsultaMovimiento =
  | 'todos'
  | 'mes'
  | 'rango';

interface MovimientoFinancieroNormalizado {
  id: string;

  categoriaId: string;
  categoriaNombre: string;

  concepto: string;
  descripcion: string | null;

  valor: number;
  fecha: string;

  estado: string;
  observacion: string | null;

  metodoPago: string | null;
  referencia: string | null;

  proveedor: string | null;
  numeroFactura: string | null;

  registradoPorId: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;

  fechaAnulacion: string | null;
  anuladoPorId: string | null;
  motivoAnulacion: string | null;
}

interface ConfiguracionListaMovimientos {
  titulo: string;
  descripcion: string;

  botonNuevo: string;

  tituloVacio: string;
  descripcionVacio: string;

  mensajeCarga: string;
  mensajeErrorCarga: string;

  tituloAnulacion: string;
  descripcionAnulacion: string;
  mensajeAnulacionExitosa: string;
  mensajeErrorAnulacion: string;
}

const CONFIGURACION_LISTA: Record<
  TipoMovimientoFinanciero,
  ConfiguracionListaMovimientos
> = {
  ingreso: {
    titulo: 'Ingresos registrados',
    descripcion:
      'Consulta, registra y administra las entradas de dinero del conjunto residencial.',

    botonNuevo: 'Registrar ingreso',

    tituloVacio: 'No hay ingresos registrados',
    descripcionVacio:
      'Registra el primer ingreso para comenzar a consolidar la información financiera.',

    mensajeCarga: 'Cargando ingresos...',
    mensajeErrorCarga:
      'No fue posible cargar los ingresos.',

    tituloAnulacion: 'Anular ingreso',
    descripcionAnulacion:
      'Indica el motivo por el cual se anulará este ingreso.',
    mensajeAnulacionExitosa:
      'El ingreso fue anulado correctamente.',
    mensajeErrorAnulacion:
      'No fue posible anular el ingreso.',
  },

  egreso: {
    titulo: 'Egresos registrados',
    descripcion:
      'Consulta, registra y administra las salidas de dinero del conjunto residencial.',

    botonNuevo: 'Registrar egreso',

    tituloVacio: 'No hay egresos registrados',
    descripcionVacio:
      'Registra el primer egreso para comenzar a controlar las obligaciones financieras.',

    mensajeCarga: 'Cargando egresos...',
    mensajeErrorCarga:
      'No fue posible cargar los egresos.',

    tituloAnulacion: 'Anular egreso',
    descripcionAnulacion:
      'Indica el motivo por el cual se anulará este egreso.',
    mensajeAnulacionExitosa:
      'El egreso fue anulado correctamente.',
    mensajeErrorAnulacion:
      'No fue posible anular el egreso.',
  },
};

@Component({
  selector: 'app-lista-movimientos-financieros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FormMovimientoFinanciero,
  ],
  templateUrl: './lista-movimientos-financieros.html',
  styleUrl: './lista-movimientos-financieros.css',
})
export class ListaMovimientosFinancieros
  implements OnInit, OnChanges {

  @Input({ required: true })
  tipo: TipoMovimientoFinanciero = 'ingreso';

  movimientos: MovimientoFinancieroNormalizado[] = [];

  tipoConsulta: TipoConsultaMovimiento = 'todos';

  mesSeleccionado = obtenerMesActualColombia();
  anioSeleccionado = obtenerAnioActualColombia();

  fechaDesde = '';
  fechaHasta = '';

  searchTerm = '';
  estadoSeleccionado = 'todos';

  itemsPerPage = 10;
  currentPage = 1;

  mostrarFormulario = false;
  movimientoEditandoId: string | null = null;

  mostrarAnulacion = false;
  movimientoAnulando: MovimientoFinancieroNormalizado | null = null;
  motivoAnulacion = '';

  isLoading = false;
  isAnulando = false;

  hasErrors = false;
  errorMessage = '';
  successMessage = '';

  private inicializado = false;

  constructor(
    private readonly ingresoService: IngresoService,
    private readonly egresoService: EgresoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get configuracion(): ConfiguracionListaMovimientos {
    return CONFIGURACION_LISTA[this.tipo];
  }

  get movimientosFiltrados(): MovimientoFinancieroNormalizado[] {
    const termino = this.searchTerm.trim().toLowerCase();

    return this.movimientos.filter((movimiento) => {
      const coincideBusqueda =
        !termino ||
        movimiento.concepto.toLowerCase().includes(termino) ||
        movimiento.categoriaNombre.toLowerCase().includes(termino) ||
        movimiento.descripcion?.toLowerCase().includes(termino) ||
        movimiento.metodoPago?.toLowerCase().includes(termino) ||
        movimiento.referencia?.toLowerCase().includes(termino) ||
        movimiento.proveedor?.toLowerCase().includes(termino) ||
        movimiento.numeroFactura?.toLowerCase().includes(termino);

      const coincideEstado =
        this.estadoSeleccionado === 'todos' ||
        movimiento.estado.toLowerCase() ===
          this.estadoSeleccionado.toLowerCase();

      return coincideBusqueda && coincideEstado;
    });
  }

  get movimientosPaginados(): MovimientoFinancieroNormalizado[] {
    const inicio =
      (this.currentPage - 1) * this.itemsPerPage;

    return this.movimientosFiltrados.slice(
      inicio,
      inicio + this.itemsPerPage
    );
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(
        this.movimientosFiltrados.length /
        this.itemsPerPage
      )
    );
  }

  get totalRegistros(): number {
    return this.movimientosFiltrados.length;
  }

  get totalValor(): number {
    return this.movimientosFiltrados
      .filter((movimiento) =>
        movimiento.estado
          .trim()
          .toLowerCase() === 'pagado'
      )
      .reduce(
        (total, movimiento) => total + movimiento.valor,
        0
      );
  }

  get estadosDisponibles(): string[] {
    const estados = new Set(
      this.movimientos.map((movimiento) => movimiento.estado)
    );

    return Array.from(estados).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  ngOnInit(): void {
    this.inicializado = true;
    this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !this.inicializado ||
      !changes['tipo'] ||
      changes['tipo'].firstChange
    ) {
      return;
    }

    this.reiniciarComponente();
    this.cargar();
  }

  cargar(): void {
    if (this.isLoading || this.isAnulando) {
      return;
    }

    if (!this.validarConsulta()) {
      return;
    }

    this.isLoading = true;
    this.limpiarMensajes();

    this.obtenerMovimientos()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (movimientos) => {
          this.movimientos = movimientos ?? [];
          this.currentPage = 1;
          this.ajustarPaginaActual();
        },
        error: (error) => {
          this.movimientos = [];
          this.mostrarError(
            error,
            this.configuracion.mensajeErrorCarga
          );
        },
      });
  }

  aplicarConsulta(): void {
    this.currentPage = 1;
    this.cargar();
  }

  cambiarTipoConsulta(
    tipoConsulta: TipoConsultaMovimiento
  ): void {
    if (this.tipoConsulta === tipoConsulta) {
      return;
    }

    this.tipoConsulta = tipoConsulta;
    this.currentPage = 1;
    this.limpiarMensajes();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.estadoSeleccionado = 'todos';

    this.tipoConsulta = 'todos';

    this.mesSeleccionado =
      obtenerMesActualColombia();

    this.anioSeleccionado =
      obtenerAnioActualColombia();

    this.fechaDesde = '';
    this.fechaHasta = '';

    this.currentPage = 1;

    this.cargar();
  }

  onFiltroChange(): void {
    this.currentPage = 1;
    this.ajustarPaginaActual();
  }

  cambiarCantidadPorPagina(): void {
    this.currentPage = 1;
    this.ajustarPaginaActual();
  }

  paginaAnterior(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage--;
  }

  paginaSiguiente(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage++;
  }

  irPagina(pagina: number): void {
    if (
      pagina < 1 ||
      pagina > this.totalPages ||
      pagina === this.currentPage
    ) {
      return;
    }

    this.currentPage = pagina;
  }

  abrirRegistro(): void {
    if (this.isLoading || this.isAnulando) {
      return;
    }

    this.limpiarMensajes();

    this.movimientoEditandoId = null;
    this.mostrarFormulario = true;
  }

  abrirEdicion(
    movimiento: MovimientoFinancieroNormalizado
  ): void {
    if (
      this.isLoading ||
      this.isAnulando
    ) {
      return;
    }

    if (this.estaAnulado(movimiento)) {
      this.mostrarValidacion(
        `El ${this.tipo} está anulado y no puede ser editado.`
      );
      return;
    }

    if (this.estaPagado(movimiento)) {
      this.mostrarValidacion(
        `Los ${this.tipo === 'ingreso' ? 'ingresos' : 'egresos'} pagados no pueden ser editados. Si necesitas corregirlo, anula el movimiento y registra uno nuevo.`
      );
      return;
    }

    this.limpiarMensajes();

    this.movimientoEditandoId = movimiento.id;
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.movimientoEditandoId = null;
  }

  onMovimientoGuardado(): void {
    const eraEdicion =
      this.movimientoEditandoId !== null;

    this.cerrarFormulario();

    this.successMessage = eraEdicion
      ? `El ${this.tipo} fue actualizado correctamente.`
      : `El ${this.tipo} fue registrado correctamente.`;

    this.cargarConservandoMensaje();
  }

  abrirAnulacion(
    movimiento: MovimientoFinancieroNormalizado
  ): void {
    if (
      this.isLoading ||
      this.isAnulando ||
      this.estaAnulado(movimiento)
    ) {
      return;
    }

    this.limpiarMensajes();

    this.movimientoAnulando = movimiento;
    this.motivoAnulacion = '';
    this.mostrarAnulacion = true;
  }

  cancelarAnulacion(): void {
    if (this.isAnulando) {
      return;
    }

    this.cerrarAnulacion();
  }

  private cerrarAnulacion(): void {
    this.mostrarAnulacion = false;
    this.movimientoAnulando = null;
    this.motivoAnulacion = '';
  }

  confirmarAnulacion(): void {
    if (
      this.isAnulando ||
      !this.movimientoAnulando
    ) {
      return;
    }

    this.limpiarMensajes();

    const motivo = this.motivoAnulacion.trim();

    if (!motivo) {
      this.mostrarValidacion(
        'El motivo de anulación es obligatorio.'
      );
      return;
    }

    if (motivo.length < 5) {
      this.mostrarValidacion(
        'El motivo de anulación debe tener al menos 5 caracteres.'
      );
      return;
    }

    if (motivo.length > 500) {
      this.mostrarValidacion(
        'El motivo de anulación no puede superar los 500 caracteres.'
      );
      return;
    }

    const movimientoId = this.movimientoAnulando.id;

    this.isAnulando = true;

    this.ejecutarAnulacion(movimientoId, motivo)
      .pipe(
        finalize(() => {
          this.isAnulando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (movimientoActualizado) => {
          const normalizado =
            this.tipo === 'ingreso'
              ? this.normalizarIngreso(
                  movimientoActualizado as IngresoResponse
                )
              : this.normalizarEgreso(
                  movimientoActualizado as EgresoResponse
                );

          this.actualizarMovimientoEnLista(normalizado);

          this.cerrarAnulacion();

          this.successMessage =
            this.configuracion.mensajeAnulacionExitosa;
        },
        error: (error) => {
          this.mostrarError(
            error,
            this.configuracion.mensajeErrorAnulacion
          );
        },
      });
  }

  estaAnulado(
    movimiento: MovimientoFinancieroNormalizado
  ): boolean {
    return movimiento.estado
      .trim()
      .toLowerCase() === 'anulado';
  }

  estaPagado(
    movimiento: MovimientoFinancieroNormalizado
  ): boolean {
    return movimiento.estado
      .trim()
      .toLowerCase() === 'pagado';
  }

  obtenerClaseEstado(estado: string): string {
    switch (estado.trim().toLowerCase()) {
      case 'pagado':
        return 'paid';

      case 'anulado':
        return 'cancelled';

      case 'pendiente':
        return 'pending';

      case 'registrado':
        return 'registered';

      default:
        return 'default';
    }
  }

  private obtenerMovimientos(): Observable<
    MovimientoFinancieroNormalizado[]
  > {
    if (this.tipo === 'ingreso') {
      return this.obtenerIngresos().pipe(
        map((ingresos) =>
          ingresos.map((ingreso) =>
            this.normalizarIngreso(ingreso)
          )
        )
      );
    }

    return this.obtenerEgresos().pipe(
      map((egresos) =>
        egresos.map((egreso) =>
          this.normalizarEgreso(egreso)
        )
      )
    );
  }

  private obtenerIngresos(): Observable<IngresoResponse[]> {
    switch (this.tipoConsulta) {
      case 'mes':
        return this.ingresoService.obtenerPorMes(
          Number(this.mesSeleccionado),
          Number(this.anioSeleccionado)
        );

      case 'rango':
        return this.ingresoService.obtenerPorRango(
          this.fechaDesde,
          this.fechaHasta
        );

      default:
        return this.ingresoService.obtener();
    }
  }

  private obtenerEgresos(): Observable<EgresoResponse[]> {
    switch (this.tipoConsulta) {
      case 'mes':
        return this.egresoService.obtenerPorMes(
          Number(this.mesSeleccionado),
          Number(this.anioSeleccionado)
        );

      case 'rango':
        return this.egresoService.obtenerPorRango(
          this.fechaDesde,
          this.fechaHasta
        );

      default:
        return this.egresoService.obtener();
    }
  }

  private ejecutarAnulacion(
    id: string,
    motivo: string
  ): Observable<IngresoResponse | EgresoResponse> {
    if (this.tipo === 'ingreso') {
      return this.ingresoService.anular(id, motivo);
    }

    return this.egresoService.anular(id, motivo);
  }

  private normalizarIngreso(
    ingreso: IngresoResponse
  ): MovimientoFinancieroNormalizado {
    return {
      id: ingreso.id,

      categoriaId: ingreso.categoriaIngresoId,
      categoriaNombre: ingreso.categoriaIngresoNombre,

      concepto: ingreso.concepto,
      descripcion: ingreso.descripcion,

      valor: ingreso.valor,
      fecha: ingreso.fechaIngreso,

      estado: ingreso.estado,
      observacion: ingreso.observacion,

      metodoPago: ingreso.metodoPago,
      referencia: ingreso.referencia,

      proveedor: null,
      numeroFactura: null,

      registradoPorId: ingreso.registradoPorId,
      fechaCreacion: ingreso.fechaCreacion,
      fechaActualizacion: ingreso.fechaActualizacion,

      fechaAnulacion: ingreso.fechaAnulacion,
      anuladoPorId: ingreso.anuladoPorId,
      motivoAnulacion: ingreso.motivoAnulacion,
    };
  }

  private normalizarEgreso(
    egreso: EgresoResponse
  ): MovimientoFinancieroNormalizado {
    return {
      id: egreso.id,

      categoriaId: egreso.categoriaEgresoId,
      categoriaNombre: egreso.categoriaEgresoNombre,

      concepto: egreso.concepto,
      descripcion: egreso.descripcion,

      valor: egreso.valor,
      fecha: egreso.fechaEgreso,

      estado: egreso.estado,
      observacion: egreso.observacion,

      metodoPago: null,
      referencia: null,

      proveedor: egreso.proveedor,
      numeroFactura: egreso.numeroFactura,

      registradoPorId: egreso.registradoPorId,
      fechaCreacion: egreso.fechaCreacion,
      fechaActualizacion: egreso.fechaActualizacion,

      fechaAnulacion: egreso.fechaAnulacion,
      anuladoPorId: egreso.anuladoPorId,
      motivoAnulacion: egreso.motivoAnulacion,
    };
  }

  private actualizarMovimientoEnLista(
    movimientoActualizado: MovimientoFinancieroNormalizado
  ): void {
    this.movimientos = this.movimientos.map((movimiento) =>
      movimiento.id === movimientoActualizado.id
        ? movimientoActualizado
        : movimiento
    );

    this.ajustarPaginaActual();
  }

  private validarConsulta(): boolean {
    if (this.tipoConsulta === 'mes') {
      const mes = Number(this.mesSeleccionado);
      const anio = Number(this.anioSeleccionado);

      if (
        !Number.isInteger(mes) ||
        mes < 1 ||
        mes > 12
      ) {
        this.mostrarValidacion(
          'El mes seleccionado no es válido.'
        );
        return false;
      }

      if (
        !Number.isInteger(anio) ||
        anio < 2000 ||
        anio > 2100
      ) {
        this.mostrarValidacion(
          'El año seleccionado no es válido.'
        );
        return false;
      }
    }

    if (this.tipoConsulta === 'rango') {
      if (!this.fechaDesde || !this.fechaHasta) {
        this.mostrarValidacion(
          'Debes seleccionar la fecha inicial y la fecha final.'
        );
        return false;
      }

      if (this.fechaDesde > this.fechaHasta) {
        this.mostrarValidacion(
          'La fecha inicial no puede ser posterior a la fecha final.'
        );
        return false;
      }
    }

    return true;
  }

  private ajustarPaginaActual(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  private cargarConservandoMensaje(): void {
    if (this.isLoading) {
      return;
    }

    const mensaje = this.successMessage;

    this.isLoading = true;
    this.hasErrors = false;
    this.errorMessage = '';

    this.obtenerMovimientos()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (movimientos) => {
          this.movimientos = movimientos ?? [];
          this.currentPage = 1;
          this.ajustarPaginaActual();
          this.successMessage = mensaje;
        },
        error: (error) => {
          this.movimientos = [];

          this.mostrarError(
            error,
            this.configuracion.mensajeErrorCarga
          );
        },
      });
  }

  private reiniciarComponente(): void {
    this.movimientos = [];

    this.tipoConsulta = 'todos';

    this.searchTerm = '';
    this.estadoSeleccionado = 'todos';

    this.mesSeleccionado =
      obtenerMesActualColombia();

    this.anioSeleccionado =
      obtenerAnioActualColombia();

    this.fechaDesde = '';
    this.fechaHasta = '';

    this.currentPage = 1;

    this.cerrarFormulario();
    this.cancelarAnulacion();

    this.isLoading = false;
    this.isAnulando = false;

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