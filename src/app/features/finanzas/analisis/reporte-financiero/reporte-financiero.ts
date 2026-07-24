import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  ConsultarReporteFinancieroParams,
  DetalleCategoriaFinancieraResponse,
  MovimientoFinancieroResponse,
  ReporteFinancieroResponse,
  ReporteFinancieroService,
  TipoPeriodoFinanciero,
} from '../../../../core/services/finanzas/reporteFinanciero/reporte-financiero.service';

import {
  ReporteFinancieroPdfService,
} from '../../../../core/services/finanzas/reporte-financiero-pdf-service/reporte-financiero-pdf.service';

interface OpcionPeriodo {
  valor: TipoPeriodoFinanciero;
  etiqueta: string;
  descripcion: string;
}

interface OpcionSeleccion {
  valor: number;
  etiqueta: string;
}

type TipoDetalleReporte =
  | 'ingresos'
  | 'egresos';

@Component({
  selector: 'app-reporte-financiero',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './reporte-financiero.html',
  styleUrl: './reporte-financiero.css',
})
export class ReporteFinanciero implements OnInit {
  reporte: ReporteFinancieroResponse | null = null;

  isLoading = false;
  isExporting = false;
  hasLoaded = false;

  errorMessage = '';
  successMessage = '';

  readonly anioActual = new Date().getFullYear();
  readonly mesActual = new Date().getMonth() + 1;

  anioSeleccionado = this.anioActual;
  tipoPeriodoSeleccionado: TipoPeriodoFinanciero = 'mensual';

  mesSeleccionado = this.mesActual;
  trimestreSeleccionado = this.obtenerTrimestreActual();
  semestreSeleccionado = this.obtenerSemestreActual();

  detalleActivo: TipoDetalleReporte = 'ingresos';

  busquedaMovimiento = '';
  categoriaSeleccionada = '';

  readonly periodosDisponibles: OpcionPeriodo[] = [
    {
      valor: 'mensual',
      etiqueta: 'Mensual',
      descripcion: 'Consulta el detalle financiero de un mes específico.',
    },
    {
      valor: 'trimestral',
      etiqueta: 'Trimestral',
      descripcion: 'Agrupa movimientos de tres meses consecutivos.',
    },
    {
      valor: 'semestral',
      etiqueta: 'Semestral',
      descripcion: 'Consulta seis meses de información financiera.',
    },
    {
      valor: 'anual',
      etiqueta: 'Anual',
      descripcion: 'Consolida todos los movimientos del año.',
    },
  ];

  readonly meses: OpcionSeleccion[] = [
    { valor: 1, etiqueta: 'Enero' },
    { valor: 2, etiqueta: 'Febrero' },
    { valor: 3, etiqueta: 'Marzo' },
    { valor: 4, etiqueta: 'Abril' },
    { valor: 5, etiqueta: 'Mayo' },
    { valor: 6, etiqueta: 'Junio' },
    { valor: 7, etiqueta: 'Julio' },
    { valor: 8, etiqueta: 'Agosto' },
    { valor: 9, etiqueta: 'Septiembre' },
    { valor: 10, etiqueta: 'Octubre' },
    { valor: 11, etiqueta: 'Noviembre' },
    { valor: 12, etiqueta: 'Diciembre' },
  ];

  readonly trimestres: OpcionSeleccion[] = [
    {
      valor: 1,
      etiqueta: 'Primer trimestre · Enero a marzo',
    },
    {
      valor: 2,
      etiqueta: 'Segundo trimestre · Abril a junio',
    },
    {
      valor: 3,
      etiqueta: 'Tercer trimestre · Julio a septiembre',
    },
    {
      valor: 4,
      etiqueta: 'Cuarto trimestre · Octubre a diciembre',
    },
  ];

  readonly semestres: OpcionSeleccion[] = [
    {
      valor: 1,
      etiqueta: 'Primer semestre · Enero a junio',
    },
    {
      valor: 2,
      etiqueta: 'Segundo semestre · Julio a diciembre',
    },
  ];

  readonly aniosDisponibles = this.generarAniosDisponibles();

  constructor(
    private readonly reporteService: ReporteFinancieroService,
    private readonly reportePdfService: ReporteFinancieroPdfService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.consultarReporte();
  }

  consultarReporte(): void {
    if (this.isLoading) {
      return;
    }

    this.limpiarMensajes();

    const validationMessage = this.validarFiltros();

    if (validationMessage) {
      this.errorMessage = validationMessage;
      return;
    }

    this.isLoading = true;

    this.reporteService
      .obtenerReporte(this.construirFiltros())
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.hasLoaded = true;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: response => {
          this.reporte = this.normalizarReporte(response);
          this.detalleActivo = 'ingresos';
          this.limpiarFiltrosDetalle();

          this.successMessage =
            'El reporte financiero se actualizó correctamente.';
        },
        error: (error) => {
          this.reporte = null;
          this.errorMessage = this.obtenerMensajeError(error);
        },
      });
  }
  esEstadoActivo(estado: string | null | undefined): boolean {
    const estadoNormalizado = estado
      ?.trim()
      .toLowerCase();

    return (
      estadoNormalizado === 'activo' ||
      estadoNormalizado === 'registrado'
    );
  }

  obtenerTextoMovimientos(cantidad: number): string {
    return `${cantidad} ${
      cantidad === 1
        ? 'movimiento'
        : 'movimientos'
    }`;
  }

  esEstadoCancelado(estado: string | null | undefined): boolean {
    const estadoNormalizado = estado
      ?.trim()
      .toLowerCase();

    return (
      estadoNormalizado === 'anulado' ||
      estadoNormalizado === 'cancelado'
    );
  }

  cambiarTipoPeriodo(
    tipoPeriodo: TipoPeriodoFinanciero
  ): void {
    if (
      this.isLoading ||
      this.tipoPeriodoSeleccionado === tipoPeriodo
    ) {
      return;
    }

    this.tipoPeriodoSeleccionado = tipoPeriodo;
    this.reporte = null;

    this.restablecerPeriodoSeleccionado();
    this.limpiarMensajes();
    this.limpiarFiltrosDetalle();

    this.consultarReporte();
  }

  cambiarDetalle(
    tipo: TipoDetalleReporte
  ): void {
    if (this.detalleActivo === tipo) {
      return;
    }

    this.detalleActivo = tipo;
    this.limpiarFiltrosDetalle();
  }

  aplicarFiltros(): void {
    this.consultarReporte();
  }

  actualizar(): void {
    this.consultarReporte();
  }

  restablecerFiltros(): void {
    if (this.isLoading) {
      return;
    }

    this.anioSeleccionado = this.anioActual;
    this.tipoPeriodoSeleccionado = 'mensual';

    this.mesSeleccionado = this.mesActual;
    this.trimestreSeleccionado =
      this.obtenerTrimestreActual();
    this.semestreSeleccionado =
      this.obtenerSemestreActual();

    this.reporte = null;
    this.detalleActivo = 'ingresos';

    this.limpiarMensajes();
    this.limpiarFiltrosDetalle();

    this.consultarReporte();
  }

  cerrarError(): void {
    this.errorMessage = '';
  }

  cerrarExito(): void {
    this.successMessage = '';
  }

  limpiarFiltrosDetalle(): void {
    this.busquedaMovimiento = '';
    this.categoriaSeleccionada = '';
  }

  exportarPdf(): void {
    if (!this.reporte || this.isExporting) {
      return;
    }

    this.isExporting = true;
    this.limpiarMensajes();

    try {
      this.reportePdfService.generar(this.reporte);

      this.successMessage =
        'El reporte financiero se generó correctamente.';
    } catch (error) {
      console.error(
        'Error al generar el reporte financiero:',
        error
      );

      this.errorMessage =
        'No fue posible generar el reporte financiero en PDF.';
    } finally {
      this.isExporting = false;
      this.cdr.detectChanges();
    }
  }

  obtenerPeriodoSeleccionado(
    tipoPeriodo: TipoPeriodoFinanciero
  ): OpcionPeriodo | undefined {
    return this.periodosDisponibles.find(
      periodo => periodo.valor === tipoPeriodo
    );
  }

  obtenerNombreMes(mes: number | null): string {
    if (mes == null) {
      return '';
    }

    return (
      this.meses.find(item => item.valor === mes)?.etiqueta ??
      `Mes ${mes}`
    );
  }

  obtenerEstadoFinanciero(): string {
    if (!this.reporte) {
      return 'Sin información';
    }

    if (this.reporte.saldoDisponible > 0) {
      return 'Saldo positivo';
    }

    if (this.reporte.saldoDisponible < 0) {
      return 'Déficit financiero';
    }

    return 'Balance equilibrado';
  }

  obtenerDescripcionEstado(): string {
    if (!this.reporte) {
      return 'Consulta un periodo para obtener el reporte financiero.';
    }

    if (this.reporte.saldoDisponible > 0) {
      return 'Los ingresos del periodo superan los egresos registrados.';
    }

    if (this.reporte.saldoDisponible < 0) {
      return 'Los egresos del periodo superan los ingresos registrados.';
    }

    return 'Los ingresos y egresos del periodo tienen el mismo valor.';
  }

  obtenerClaseSaldo(): string {
    if (!this.reporte) {
      return 'financial-report-summary--neutral';
    }

    if (this.reporte.saldoDisponible > 0) {
      return 'financial-report-summary--positive';
    }

    if (this.reporte.saldoDisponible < 0) {
      return 'financial-report-summary--negative';
    }

    return 'financial-report-summary--neutral';
  }

  get categoriasDetalleActivo(): DetalleCategoriaFinancieraResponse[] {
    if (!this.reporte) {
      return [];
    }

    return this.detalleActivo === 'ingresos'
      ? this.reporte.ingresosPorCategoria
      : this.reporte.egresosPorCategoria;
  }

  get movimientosDetalleActivo(): MovimientoFinancieroResponse[] {
    if (!this.reporte) {
      return [];
    }

    return this.detalleActivo === 'ingresos'
      ? this.reporte.ingresosDetalle
      : this.reporte.egresosDetalle;
  }

  get movimientosFiltrados(): MovimientoFinancieroResponse[] {
    const termino = this.busquedaMovimiento
      .trim()
      .toLowerCase();

    return this.movimientosDetalleActivo.filter(
      movimiento => {
        const coincideCategoria =
          !this.categoriaSeleccionada ||
          movimiento.categoriaId ===
            this.categoriaSeleccionada;

        if (!coincideCategoria) {
          return false;
        }

        if (!termino) {
          return true;
        }

        const campos = [
          movimiento.concepto,
          movimiento.descripcion,
          movimiento.categoriaNombre,
          movimiento.tipoMovimiento,
          movimiento.estado,
          movimiento.tercero,
          movimiento.referencia,
          movimiento.observacion,
        ];

        return campos.some(
          campo =>
            typeof campo === 'string' &&
            campo.toLowerCase().includes(termino)
        );
      }
    );
  }
  get totalMovimientosFiltrados(): number {
    return this.movimientosFiltrados.length;
  }

  get valorMovimientosFiltrados(): number {
    return this.movimientosFiltrados.reduce(
      (total, movimiento) =>
        total + movimiento.valor,
      0
    );
  }

  get totalMovimientosReporte(): number {
    return (
      (this.reporte?.cantidadIngresos ?? 0) +
      (this.reporte?.cantidadEgresos ?? 0)
    );
  }

  get porcentajeIngresosPorCantidad(): number {
    if (!this.reporte || this.totalMovimientosReporte === 0) {
      return 0;
    }

    return Number(
      (
        (
          this.reporte.cantidadIngresos /
          this.totalMovimientosReporte
        ) * 100
      ).toFixed(2)
    );
  }

  get porcentajeEgresosPorCantidad(): number {
    if (!this.reporte || this.totalMovimientosReporte === 0) {
      return 0;
    }

    return Number(
      (
        (
          this.reporte.cantidadEgresos /
          this.totalMovimientosReporte
        ) * 100
      ).toFixed(2)
    );
  }

  private normalizarReporte(
    response: ReporteFinancieroResponse
  ): ReporteFinancieroResponse {
    return {
      ...response,
      ingresosPorCategoria:
        response.ingresosPorCategoria ?? [],
      egresosPorCategoria:
        response.egresosPorCategoria ?? [],
      ingresosDetalle:
        response.ingresosDetalle ?? [],
      egresosDetalle:
        response.egresosDetalle ?? [],
    };
  }

  private calcularPorcentajeMovimientos(
    cantidad: number
  ): number {
    if (this.totalMovimientosReporte === 0) {
      return 0;
    }

    return Number(
      (
        (cantidad / this.totalMovimientosReporte) *
        100
      ).toFixed(2)
    );
  }

  private construirFiltros(): ConsultarReporteFinancieroParams {
    const filtros: ConsultarReporteFinancieroParams = {
      anio: this.anioSeleccionado,
      tipoPeriodo: this.tipoPeriodoSeleccionado,
    };

    switch (this.tipoPeriodoSeleccionado) {
      case 'mensual':
        filtros.mes = this.mesSeleccionado;
        break;

      case 'trimestral':
        filtros.trimestre =
          this.trimestreSeleccionado;
        break;

      case 'semestral':
        filtros.semestre =
          this.semestreSeleccionado;
        break;

      case 'anual':
        break;
    }

    return filtros;
  }

  private validarFiltros(): string {
    if (
      !Number.isInteger(this.anioSeleccionado) ||
      this.anioSeleccionado < 2000 ||
      this.anioSeleccionado > this.anioActual
    ) {
      return 'El año seleccionado no es válido.';
    }

    if (
      this.tipoPeriodoSeleccionado === 'mensual' &&
      (
        !Number.isInteger(this.mesSeleccionado) ||
        this.mesSeleccionado < 1 ||
        this.mesSeleccionado > 12
      )
    ) {
      return 'El mes seleccionado no es válido.';
    }

    if (
      this.tipoPeriodoSeleccionado === 'trimestral' &&
      (
        !Number.isInteger(this.trimestreSeleccionado) ||
        this.trimestreSeleccionado < 1 ||
        this.trimestreSeleccionado > 4
      )
    ) {
      return 'El trimestre seleccionado no es válido.';
    }

    if (
      this.tipoPeriodoSeleccionado === 'semestral' &&
      (
        !Number.isInteger(this.semestreSeleccionado) ||
        this.semestreSeleccionado < 1 ||
        this.semestreSeleccionado > 2
      )
    ) {
      return 'El semestre seleccionado no es válido.';
    }

    return '';
  }

  private restablecerPeriodoSeleccionado(): void {
    switch (this.tipoPeriodoSeleccionado) {
      case 'mensual':
        this.mesSeleccionado = this.mesActual;
        break;

      case 'trimestral':
        this.trimestreSeleccionado =
          this.obtenerTrimestreActual();
        break;

      case 'semestral':
        this.semestreSeleccionado =
          this.obtenerSemestreActual();
        break;

      case 'anual':
        break;
    }
  }

  private generarAniosDisponibles(): number[] {
    const cantidadAnios = 8;

    return Array.from(
      { length: cantidadAnios },
      (_, index) => this.anioActual - index
    );
  }

  private obtenerTrimestreActual(): number {
    return Math.floor((this.mesActual - 1) / 3) + 1;
  }

  private obtenerSemestreActual(): number {
    return this.mesActual <= 6 ? 1 : 2;
  }

  private limpiarMensajes(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private obtenerMensajeError(error: any): string {
    const backendMessage =
      error?.error?.message ??
      error?.error?.mensaje ??
      error?.error?.title;

    if (
      typeof backendMessage === 'string' &&
      backendMessage.trim()
    ) {
      return backendMessage;
    }

    const validationErrors = error?.error?.errors;

    if (
      validationErrors &&
      typeof validationErrors === 'object'
    ) {
      const firstValidationError = Object.values(
        validationErrors
      )
        .flat()
        .find(
          message =>
            typeof message === 'string' &&
            message.trim().length > 0
        );

      if (typeof firstValidationError === 'string') {
        return firstValidationError;
      }
    }

    switch (error?.status) {
      case 0:
        return 'No fue posible conectarse con el servidor. Verifica que la API esté disponible.';

      case 400:
        return 'Los filtros enviados no son válidos. Revisa el periodo seleccionado.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para consultar el reporte financiero.';

      case 404:
        return 'No se encontró información financiera para el periodo seleccionado.';

      case 500:
        return 'Ocurrió un error interno al consultar el reporte financiero.';

      default:
        return 'No fue posible obtener el reporte financiero.';
    }
  }
}