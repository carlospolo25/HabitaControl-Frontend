import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {
  GestionCategoriasFinancieras,
  TipoCategoriaFinanciera,
} from '../categorias/gestion-categorias-financieras/gestion-categorias-financieras';

import {
  ListaMovimientosFinancieros,
} from '../movimientos/lista-movimientos-financieros/lista-movimientos-financieros';

import {
  BalanceFinanciero,
} from '../analisis/balance-financiero/balance-financiero';

type VistaGestionFinanzas =
  | 'ingresos'
  | 'egresos'
  | 'categorias'
  | 'analisis';

@Component({
  selector: 'app-gestion-finanzas',
  standalone: true,
  imports: [
    CommonModule,
    GestionCategoriasFinancieras,
    ListaMovimientosFinancieros,
    BalanceFinanciero,
  ],
  templateUrl: './gestion-finanzas.html',
  styleUrl: './gestion-finanzas.css',
})
export class GestionFinanzas {
  vistaActiva: VistaGestionFinanzas = 'categorias';

  tipoCategoriaActiva: TipoCategoriaFinanciera = 'ingreso';

  cambiarVista(vista: VistaGestionFinanzas): void {
    if (this.vistaActiva === vista) {
      return;
    }

    this.vistaActiva = vista;
  }

  cambiarTipoCategoria(
    tipo: TipoCategoriaFinanciera
  ): void {
    if (this.tipoCategoriaActiva === tipo) {
      return;
    }

    this.tipoCategoriaActiva = tipo;
  }

  esVistaActiva(
    vista: VistaGestionFinanzas
  ): boolean {
    return this.vistaActiva === vista;
  }

  esTipoCategoriaActivo(
    tipo: TipoCategoriaFinanciera
  ): boolean {
    return this.tipoCategoriaActiva === tipo;
  }
}