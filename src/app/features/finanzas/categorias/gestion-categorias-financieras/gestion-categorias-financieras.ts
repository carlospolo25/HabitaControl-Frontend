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
import { finalize, Observable } from 'rxjs';

import {
  CategoriaIngresoResponse,
  CategoriaIngresoService,
} from '../../../../core/services/finanzas/categoriaIngreso/categoria-ingreso.service';

import {
  CategoriaEgresoResponse,
  CategoriaEgresoService,
} from '../../../../core/services/finanzas/categoriaEgreso/categoria-egreso.service';

export type TipoCategoriaFinanciera = 'ingreso' | 'egreso';

export interface CategoriaFinancieraResponse {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

interface GuardarCategoriaFinancieraRequest {
  nombre: string;
  descripcion?: string | null;
}

interface ConfiguracionCategoriaFinanciera {
  titulo: string;
  descripcion: string;
  tituloRegistro: string;
  tituloEdicion: string;
  descripcionRegistro: string;
  descripcionEdicion: string;
  placeholderNombre: string;
  mensajeCarga: string;
  mensajeVacio: string;
  mensajeRegistroExitoso: string;
  mensajeActualizacionExitosa: string;
  mensajeErrorCarga: string;
  mensajeErrorRegistro: string;
  mensajeErrorActualizacion: string;
}

const CONFIGURACION_CATEGORIAS: Record<
  TipoCategoriaFinanciera,
  ConfiguracionCategoriaFinanciera
> = {
  ingreso: {
    titulo: 'Categorías de ingreso',
    descripcion:
      'Crea, edita y administra las categorías utilizadas para clasificar los ingresos.',
    tituloRegistro: 'Registrar categoría de ingreso',
    tituloEdicion: 'Editar categoría de ingreso',
    descripcionRegistro:
      'Define una categoría para clasificar correctamente los ingresos financieros.',
    descripcionEdicion:
      'Actualiza la información de la categoría de ingreso seleccionada.',
    placeholderNombre: 'Ej. Cuotas de administración',
    mensajeCarga: 'Cargando categorías de ingreso...',
    mensajeVacio:
      'Registra la primera categoría para comenzar a clasificar los ingresos.',
    mensajeRegistroExitoso:
      'La categoría de ingreso fue registrada correctamente.',
    mensajeActualizacionExitosa:
      'La categoría de ingreso fue actualizada correctamente.',
    mensajeErrorCarga:
      'No fue posible cargar las categorías de ingreso.',
    mensajeErrorRegistro:
      'No fue posible registrar la categoría de ingreso.',
    mensajeErrorActualizacion:
      'No fue posible actualizar la categoría de ingreso.',
  },

  egreso: {
    titulo: 'Categorías de egreso',
    descripcion:
      'Crea, edita y administra las categorías utilizadas para clasificar los egresos.',
    tituloRegistro: 'Registrar categoría de egreso',
    tituloEdicion: 'Editar categoría de egreso',
    descripcionRegistro:
      'Define una categoría para organizar los gastos y obligaciones financieras.',
    descripcionEdicion:
      'Actualiza la información de la categoría de egreso seleccionada.',
    placeholderNombre: 'Ej. Mantenimiento y reparaciones',
    mensajeCarga: 'Cargando categorías de egreso...',
    mensajeVacio:
      'Registra la primera categoría para comenzar a clasificar los egresos.',
    mensajeRegistroExitoso:
      'La categoría de egreso fue registrada correctamente.',
    mensajeActualizacionExitosa:
      'La categoría de egreso fue actualizada correctamente.',
    mensajeErrorCarga:
      'No fue posible cargar las categorías de egreso.',
    mensajeErrorRegistro:
      'No fue posible registrar la categoría de egreso.',
    mensajeErrorActualizacion:
      'No fue posible actualizar la categoría de egreso.',
  },
};

@Component({
  selector: 'app-gestion-categorias-financieras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-categorias-financieras.html',
  styleUrl: './gestion-categorias-financieras.css',
})
export class GestionCategoriasFinancieras implements OnInit, OnChanges {
  @Input({ required: true })
  tipo: TipoCategoriaFinanciera = 'ingreso';

  categorias: CategoriaFinancieraResponse[] = [];

  nombre = '';
  descripcion = '';

  categoriaEditandoId: string | null = null;
  categoriaCambiandoEstadoId: string | null = null;

  isLoading = false;
  isSubmitting = false;

  hasErrors = false;
  errorMessage = '';
  successMessage = '';

  private inicializado = false;

  constructor(
    private readonly categoriaIngresoService: CategoriaIngresoService,
    private readonly categoriaEgresoService: CategoriaEgresoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get configuracion(): ConfiguracionCategoriaFinanciera {
    return CONFIGURACION_CATEGORIAS[this.tipo];
  }

  get tituloFormulario(): string {
    return this.categoriaEditandoId
      ? this.configuracion.tituloEdicion
      : this.configuracion.tituloRegistro;
  }

  get descripcionFormulario(): string {
    return this.categoriaEditandoId
      ? this.configuracion.descripcionEdicion
      : this.configuracion.descripcionRegistro;
  }

  ngOnInit(): void {
    this.inicializado = true;
    this.cargar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['tipo'] &&
      !changes['tipo'].firstChange &&
      this.inicializado
    ) {
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

    this.obtenerCategorias()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (categorias) => {
          this.categorias = categorias ?? [];
        },
        error: (error) => {
          this.categorias = [];
          this.mostrarError(
            error,
            this.configuracion.mensajeErrorCarga
          );
        },
      });
  }

  guardar(): void {
    if (this.isSubmitting || this.isLoading) {
      return;
    }

    this.limpiarMensajes();

    const nombre = this.nombre.trim();
    const descripcion = this.descripcion.trim();

    if (!nombre) {
      this.hasErrors = true;
      this.errorMessage =
        'El nombre de la categoría es obligatorio.';
      return;
    }

    if (nombre.length < 2) {
      this.hasErrors = true;
      this.errorMessage =
        'El nombre de la categoría debe tener al menos 2 caracteres.';
      return;
    }

    if (nombre.length > 100) {
      this.hasErrors = true;
      this.errorMessage =
        'El nombre de la categoría no puede superar los 100 caracteres.';
      return;
    }

    if (descripcion.length > 300) {
      this.hasErrors = true;
      this.errorMessage =
        'La descripción no puede superar los 300 caracteres.';
      return;
    }

    const request: GuardarCategoriaFinancieraRequest = {
      nombre,
      descripcion: descripcion || null,
    };

    this.isSubmitting = true;

    if (this.categoriaEditandoId) {
      this.actualizarCategoria(
        this.categoriaEditandoId,
        request
      );
      return;
    }

    this.registrarCategoria(request);
  }

  editar(categoria: CategoriaFinancieraResponse): void {
    if (
      this.isSubmitting ||
      this.categoriaCambiandoEstadoId !== null
    ) {
      return;
    }

    this.limpiarMensajes();

    this.categoriaEditandoId = categoria.id;
    this.nombre = categoria.nombre;
    this.descripcion = categoria.descripcion ?? '';
  }

  cancelarEdicion(): void {
    if (this.isSubmitting) {
      return;
    }

    this.limpiarFormulario();
    this.limpiarMensajes();
  }

  cambiarEstado(categoria: CategoriaFinancieraResponse): void {
    if (
      this.isSubmitting ||
      this.isLoading ||
      this.categoriaCambiandoEstadoId !== null ||
      !categoria.id
    ) {
      return;
    }

    this.limpiarMensajes();

    const nuevoEstado = !categoria.activa;

    this.categoriaCambiandoEstadoId = categoria.id;

    this.ejecutarCambioEstado(categoria.id, nuevoEstado)
      .pipe(
        finalize(() => {
          this.categoriaCambiandoEstadoId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (categoriaActualizada) => {
          this.actualizarCategoriaEnLista(categoriaActualizada);

          if (
            this.categoriaEditandoId === categoriaActualizada.id &&
            !categoriaActualizada.activa
          ) {
            this.limpiarFormulario();
          }

          this.successMessage = categoriaActualizada.activa
            ? 'La categoría fue activada correctamente.'
            : 'La categoría fue desactivada correctamente.';
        },
        error: (error) => {
          this.mostrarError(
            error,
            'No fue posible cambiar el estado de la categoría.'
          );
        },
      });
  }

  limpiarFormulario(): void {
    this.nombre = '';
    this.descripcion = '';
    this.categoriaEditandoId = null;
  }

  private registrarCategoria(
    request: GuardarCategoriaFinancieraRequest
  ): void {
    this.ejecutarRegistro(request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (categoria) => {
          this.categorias = [categoria, ...this.categorias];
          this.limpiarFormulario();

          this.successMessage =
            this.configuracion.mensajeRegistroExitoso;
        },
        error: (error) => {
          this.mostrarError(
            error,
            this.configuracion.mensajeErrorRegistro
          );
        },
      });
  }

  private actualizarCategoria(
    id: string,
    request: GuardarCategoriaFinancieraRequest
  ): void {
    this.ejecutarActualizacion(id, request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (categoria) => {
          this.actualizarCategoriaEnLista(categoria);
          this.limpiarFormulario();

          this.successMessage =
            this.configuracion.mensajeActualizacionExitosa;
        },
        error: (error) => {
          this.mostrarError(
            error,
            this.configuracion.mensajeErrorActualizacion
          );
        },
      });
  }

  private obtenerCategorias(): Observable<
    CategoriaFinancieraResponse[]
  > {
    if (this.tipo === 'ingreso') {
      return this.categoriaIngresoService.obtener();
    }

    return this.categoriaEgresoService.obtener();
  }

  private ejecutarRegistro(
    request: GuardarCategoriaFinancieraRequest
  ): Observable<CategoriaFinancieraResponse> {
    if (this.tipo === 'ingreso') {
      return this.categoriaIngresoService.registrar(request);
    }

    return this.categoriaEgresoService.registrar(request);
  }

  private ejecutarActualizacion(
    id: string,
    request: GuardarCategoriaFinancieraRequest
  ): Observable<CategoriaFinancieraResponse> {
    if (this.tipo === 'ingreso') {
      return this.categoriaIngresoService.actualizar(id, request);
    }

    return this.categoriaEgresoService.actualizar(id, request);
  }

  private ejecutarCambioEstado(
    id: string,
    activa: boolean
  ): Observable<CategoriaFinancieraResponse> {
    if (this.tipo === 'ingreso') {
      return this.categoriaIngresoService.cambiarEstado(id, activa);
    }

    return this.categoriaEgresoService.cambiarEstado(id, activa);
  }

  private actualizarCategoriaEnLista(
    categoriaActualizada: CategoriaFinancieraResponse
  ): void {
    this.categorias = this.categorias.map((categoria) =>
      categoria.id === categoriaActualizada.id
        ? categoriaActualizada
        : categoria
    );
  }

  private reiniciarComponente(): void {
    this.categorias = [];
    this.limpiarFormulario();
    this.limpiarMensajes();

    this.isLoading = false;
    this.isSubmitting = false;
    this.categoriaCambiandoEstadoId = null;
  }

  private limpiarMensajes(): void {
    this.hasErrors = false;
    this.errorMessage = '';
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