import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  BalanceFinancieroResponse,
  BalanceFinancieroService,
  ConsultarBalanceFinancieroParams,
  TipoPeriodoFinanciero,
} from '../../../../core/services/finanzas/balanceFinanciero/balance-financiero.service';

import {
  ReporteFinanciero,
} from '../reporte-financiero/reporte-financiero';

interface OpcionPeriodo {
  valor: TipoPeriodoFinanciero;
  etiqueta: string;
  descripcion: string;
}

interface OpcionSeleccion {
  valor: number;
  etiqueta: string;
}

type VistaAnalisisFinanciero =
  | 'balance'
  | 'reporte';

@Component({
  selector: 'app-balance-financiero',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReporteFinanciero
  ],
  templateUrl: './balance-financiero.html',
  styleUrl: './balance-financiero.css',
})
export class BalanceFinanciero implements OnInit {
  vistaActiva: VistaAnalisisFinanciero = 'balance';
  balance: BalanceFinancieroResponse | null = null;

  isLoading = false;
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

  readonly periodosDisponibles: OpcionPeriodo[] = [
    {
      valor: 'mensual',
      etiqueta: 'Mensual',
      descripcion: 'Consulta los movimientos de un mes específico.',
    },
    {
      valor: 'trimestral',
      etiqueta: 'Trimestral',
      descripcion: 'Agrupa la información en periodos de tres meses.',
    },
    {
      valor: 'semestral',
      etiqueta: 'Semestral',
      descripcion: 'Consulta el primer o segundo semestre del año.',
    },
    {
      valor: 'anual',
      etiqueta: 'Anual',
      descripcion: 'Presenta el resultado acumulado de todo el año.',
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
    private readonly balanceService: BalanceFinancieroService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.consultarBalance();
  }

  cambiarVista(
    vista: VistaAnalisisFinanciero
  ): void {
    if (this.vistaActiva === vista) {
      return;
    }

    this.vistaActiva = vista;

    this.limpiarMensajes();

    if (
      vista === 'balance' &&
      !this.balance &&
      !this.isLoading
    ) {
      this.consultarBalance();
    }
  }

  esVistaActiva(
    vista: VistaAnalisisFinanciero
  ): boolean {
    return this.vistaActiva === vista;
  }

  consultarBalance(): void {
    if (this.isLoading) {
      return;
    }

    this.limpiarMensajes();

    const validationMessage = this.validarFiltros();

    if (validationMessage) {
      this.errorMessage = validationMessage;
      return;
    }

    const filtros = this.construirFiltros();

    this.isLoading = true;

    this.balanceService
      .obtenerBalance(filtros)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.hasLoaded = true;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.balance = response;

          this.successMessage =
            'El balance financiero se actualizó correctamente.';
        },
        error: (error) => {
          this.balance = null;
          this.errorMessage = this.obtenerMensajeError(error);
        },
      });
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
    this.balance = null;

    this.restablecerPeriodoSeleccionado();
    this.limpiarMensajes();

    this.consultarBalance();
  }

  aplicarFiltros(): void {
    this.consultarBalance();
  }

  actualizar(): void {
    this.consultarBalance();
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

    this.balance = null;
    this.limpiarMensajes();

    this.consultarBalance();
  }

  cerrarError(): void {
    this.errorMessage = '';
  }

  cerrarExito(): void {
    this.successMessage = '';
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

  obtenerClaseSaldo(): string {
    if (!this.balance) {
      return 'balance-summary--neutral';
    }

    if (this.balance.saldoDisponible > 0) {
      return 'balance-summary--positive';
    }

    if (this.balance.saldoDisponible < 0) {
      return 'balance-summary--negative';
    }

    return 'balance-summary--neutral';
  }

  obtenerEstadoFinanciero(): string {
    if (!this.balance) {
      return 'Sin información';
    }

    if (this.balance.saldoDisponible > 0) {
      return 'Saldo positivo';
    }

    if (this.balance.saldoDisponible < 0) {
      return 'Déficit financiero';
    }

    return 'Balance equilibrado';
  }

  obtenerDescripcionEstado(): string {
    if (!this.balance) {
      return 'Consulta un periodo para analizar el estado financiero.';
    }

    if (this.balance.saldoDisponible > 0) {
      return 'Los ingresos del periodo superan los egresos registrados.';
    }

    if (this.balance.saldoDisponible < 0) {
      return 'Los egresos del periodo superan los ingresos registrados.';
    }

    return 'Los ingresos y egresos del periodo tienen el mismo valor.';
  }

  obtenerPorcentajeEjecucion(): number {
    if (!this.balance) {
      return 0;
    }

    if (this.balance.totalIngresos <= 0) {
      return this.balance.totalEgresos > 0 ? 100 : 0;
    }

    const porcentaje =
      (this.balance.totalEgresos /
        this.balance.totalIngresos) *
      100;

    return Math.min(
      Math.max(Number(porcentaje.toFixed(2)), 0),
      100
    );
  }

  obtenerPorcentajeSaldo(): number {
    if (!this.balance || this.balance.totalIngresos <= 0) {
      return 0;
    }

    const porcentaje =
      (this.balance.saldoDisponible /
        this.balance.totalIngresos) *
      100;

    return Number(porcentaje.toFixed(2));
  }

  trackByValor(
    _index: number,
    item: OpcionPeriodo | OpcionSeleccion
  ): string | number {
    return item.valor;
  }

  trackByAnio(_index: number, anio: number): number {
    return anio;
  }

  private construirFiltros(): ConsultarBalanceFinancieroParams {
    const filtros: ConsultarBalanceFinancieroParams = {
      anio: this.anioSeleccionado,
      tipoPeriodo: this.tipoPeriodoSeleccionado,
    };

    if (this.tipoPeriodoSeleccionado === 'mensual') {
      filtros.mes = this.mesSeleccionado;
    }

    if (this.tipoPeriodoSeleccionado === 'trimestral') {
      filtros.trimestre = this.trimestreSeleccionado;
    }

    if (this.tipoPeriodoSeleccionado === 'semestral') {
      filtros.semestre = this.semestreSeleccionado;
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
        return 'No tienes permisos para consultar el balance financiero.';

      case 404:
        return 'No se encontró información financiera para el periodo seleccionado.';

      case 500:
        return 'Ocurrió un error interno al consultar el balance financiero.';

      default:
        return 'No fue posible obtener el balance financiero.';
    }
  }
}