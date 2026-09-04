import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  DetalleCategoriaFinancieraResponse,
  MovimientoFinancieroResponse,
  ReporteFinancieroResponse,
} from '../reporteFinanciero/reporte-financiero.service';

type ColorRgb = [number, number, number];

@Injectable({
  providedIn: 'root',
})
export class ReporteFinancieroPdfService {
  private readonly colores = {
    azulOscuro: [15, 23, 42] as ColorRgb,
    azulPrincipal: [37, 99, 235] as ColorRgb,
    verdeExito: [22, 163, 74] as ColorRgb,
    rojoAlerta: [220, 38, 38] as ColorRgb,
    fondoClaro: [248, 250, 252] as ColorRgb,
    textoPrincipal: [17, 24, 39] as ColorRgb,
    textoSecundario: [71, 85, 105] as ColorRgb,
    borde: [226, 232, 240] as ColorRgb,
    blanco: [255, 255, 255] as ColorRgb,
  };

  private readonly margenHorizontal = 14;

  generar(reporte: ReporteFinancieroResponse): void {
    if (!reporte) {
      throw new Error(
        'No se proporcionó información para generar el reporte financiero.'
      );
    }

    const documento = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const ingresosPagados = (reporte.ingresosDetalle ?? [])
      .filter(
        movimiento =>
          movimiento.estado
            ?.trim()
            .toLowerCase() === 'pagado'
      );

    const egresosPagados = (reporte.egresosDetalle ?? [])
      .filter(
        movimiento =>
          movimiento.estado
            ?.trim()
            .toLowerCase() === 'pagado'
      );

    this.configurarPropiedades(documento, reporte);
    this.agregarEncabezado(documento, reporte);

    let posicionY = 48;

    posicionY = this.agregarResumenFinanciero(
      documento,
      reporte,
      ingresosPagados.length,
      egresosPagados.length,
      posicionY
    );

    posicionY = this.agregarInformacionPeriodo(
      documento,
      reporte,
      posicionY + 7
    );

    posicionY = this.agregarCategorias(
      documento,
      'Ingresos por categoría',
      reporte.ingresosPorCategoria ?? [],
      this.colores.verdeExito,
      posicionY + 8
    );

    posicionY = this.agregarCategorias(
      documento,
      'Egresos por categoría',
      reporte.egresosPorCategoria ?? [],
      this.colores.rojoAlerta,
      posicionY + 8
    );

    posicionY = this.agregarMovimientos(
      documento,
      'Detalle de ingresos',
      ingresosPagados,
      this.colores.verdeExito,
      posicionY + 8
    );

    this.agregarMovimientos(
      documento,
      'Detalle de egresos',
      egresosPagados,
      this.colores.rojoAlerta,
      posicionY + 8
    );

    this.agregarPaginacion(documento);
    this.descargar(documento, reporte);
  }

  private formatearFechaPeriodo(
    fecha: string | Date | null | undefined
  ): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaConvertida =
      fecha instanceof Date
        ? fecha
        : new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return 'Fecha inválida';
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(fechaConvertida);
  }

  private configurarPropiedades(
    documento: jsPDF,
    reporte: ReporteFinancieroResponse
  ): void {
    documento.setProperties({
      title: `Reporte financiero - ${reporte.periodoTexto}`,
      subject: 'Reporte financiero de HabitaControl',
      author: 'HabitaControl',
      creator: 'HabitaControl',
      keywords:
        'HabitaControl, finanzas, ingresos, egresos, balance financiero',
    });
  }

  private agregarEncabezado(
    documento: jsPDF,
    reporte: ReporteFinancieroResponse
  ): void {
    const anchoPagina = documento.internal.pageSize.getWidth();

    documento.setFillColor(...this.colores.azulOscuro);
    documento.rect(0, 0, anchoPagina, 36, 'F');

    documento.setFillColor(...this.colores.azulPrincipal);
    documento.roundedRect(
      this.margenHorizontal,
      9,
      12,
      12,
      2,
      2,
      'F'
    );

    documento.setTextColor(...this.colores.blanco);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(13);
    documento.text('HC', this.margenHorizontal + 2.3, 17);

    documento.setFontSize(18);
    documento.text(
      'HabitaControl',
      this.margenHorizontal + 17,
      14
    );

    documento.setFont('helvetica', 'normal');
    documento.setFontSize(9);
    documento.text(
      'Gestión financiera residencial',
      this.margenHorizontal + 17,
      20
    );

    documento.setFont('helvetica', 'bold');
    documento.setFontSize(16);
    documento.text(
      'Reporte financiero',
      anchoPagina - this.margenHorizontal,
      14,
      { align: 'right' }
    );

    documento.setFont('helvetica', 'normal');
    documento.setFontSize(9);
    documento.text(
      reporte.periodoTexto || this.obtenerPeriodoAlternativo(reporte),
      anchoPagina - this.margenHorizontal,
      21,
      { align: 'right' }
    );

    documento.text(
      `Generado: ${this.formatearFechaHora(new Date())}`,
      anchoPagina - this.margenHorizontal,
      27,
      { align: 'right' }
    );
  }

  private agregarResumenFinanciero(
    documento: jsPDF,
    reporte: ReporteFinancieroResponse,
    cantidadIngresos: number,
    cantidadEgresos: number,
    posicionY: number
  ): number {
    const anchoPagina = documento.internal.pageSize.getWidth();
    const espacioEntreTarjetas = 6;

    const anchoDisponible =
      anchoPagina - this.margenHorizontal * 2;

    const anchoTarjeta =
      (anchoDisponible - espacioEntreTarjetas * 2) / 3;

    this.dibujarTarjetaResumen(
      documento,
      this.margenHorizontal,
      posicionY,
      anchoTarjeta,
      'Total de ingresos',
      this.formatearMoneda(reporte.totalIngresos),
      `${cantidadIngresos} ${this.obtenerTextoMovimientos(
        cantidadIngresos
      )}`,
      this.colores.verdeExito
    );

    this.dibujarTarjetaResumen(
      documento,
      this.margenHorizontal +
        anchoTarjeta +
        espacioEntreTarjetas,
      posicionY,
      anchoTarjeta,
      'Total de egresos',
      this.formatearMoneda(reporte.totalEgresos),
      `${cantidadEgresos} ${this.obtenerTextoMovimientos(
        cantidadEgresos
      )}`,
      this.colores.rojoAlerta
    );

    const colorSaldo =
      reporte.saldoDisponible < 0
        ? this.colores.rojoAlerta
        : reporte.saldoDisponible > 0
          ? this.colores.azulPrincipal
          : this.colores.textoSecundario;

    this.dibujarTarjetaResumen(
      documento,
      this.margenHorizontal +
        (anchoTarjeta + espacioEntreTarjetas) * 2,
      posicionY,
      anchoTarjeta,
      'Saldo disponible',
      this.formatearMoneda(reporte.saldoDisponible),
      this.obtenerEstadoSaldo(reporte.saldoDisponible),
      colorSaldo
    );

    return posicionY + 31;
  }

  private dibujarTarjetaResumen(
    documento: jsPDF,
    posicionX: number,
    posicionY: number,
    ancho: number,
    titulo: string,
    valor: string,
    descripcion: string,
    colorAcento: ColorRgb
  ): void {
    documento.setFillColor(...this.colores.blanco);
    documento.setDrawColor(...this.colores.borde);
    documento.roundedRect(
      posicionX,
      posicionY,
      ancho,
      26,
      2,
      2,
      'FD'
    );

    documento.setFillColor(...colorAcento);
    documento.roundedRect(
      posicionX,
      posicionY,
      3,
      26,
      1,
      1,
      'F'
    );

    documento.setTextColor(...this.colores.textoSecundario);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(8);
    documento.text(
      titulo.toUpperCase(),
      posicionX + 8,
      posicionY + 7
    );

    documento.setTextColor(...this.colores.textoPrincipal);
    documento.setFontSize(14);
    documento.text(
      valor,
      posicionX + 8,
      posicionY + 15
    );

    documento.setTextColor(...colorAcento);
    documento.setFont('helvetica', 'normal');
    documento.setFontSize(8);
    documento.text(
      descripcion,
      posicionX + 8,
      posicionY + 21
    );
  }

  private agregarInformacionPeriodo(
    documento: jsPDF,
    reporte: ReporteFinancieroResponse,
    posicionY: number
  ): number {
    this.verificarEspacio(documento, posicionY, 25);

    const anchoPagina = documento.internal.pageSize.getWidth();
    const anchoDisponible =
      anchoPagina - this.margenHorizontal * 2;

    documento.setFillColor(...this.colores.fondoClaro);
    documento.setDrawColor(...this.colores.borde);
    documento.roundedRect(
      this.margenHorizontal,
      posicionY,
      anchoDisponible,
      19,
      2,
      2,
      'FD'
    );

    documento.setFont('helvetica', 'bold');
    documento.setFontSize(9);
    documento.setTextColor(...this.colores.textoPrincipal);

    documento.text(
      'Periodo consultado',
      this.margenHorizontal + 5,
      posicionY + 6
    );

    documento.setFont('helvetica', 'normal');
    documento.setTextColor(...this.colores.textoSecundario);

    documento.text(
      reporte.periodoTexto || this.obtenerPeriodoAlternativo(reporte),
      this.margenHorizontal + 5,
      posicionY + 12
    );

    documento.setFont('helvetica', 'bold');
    documento.setTextColor(...this.colores.textoPrincipal);

    documento.text(
      'Rango de fechas',
      this.margenHorizontal + 105,
      posicionY + 6
    );

    documento.setFont('helvetica', 'normal');
    documento.setTextColor(...this.colores.textoSecundario);

    documento.text(
    `${this.formatearFechaPeriodo(
      reporte.fechaInicio
      )} al ${this.formatearFechaPeriodo(
        reporte.fechaFin
      )}`,
      this.margenHorizontal + 105,
      posicionY + 12
    );

    documento.setFont('helvetica', 'bold');
    documento.setTextColor(...this.colores.textoPrincipal);

    documento.text(
      'Estado financiero',
      anchoPagina - this.margenHorizontal - 65,
      posicionY + 6
    );

    const colorEstado =
      reporte.saldoDisponible < 0
        ? this.colores.rojoAlerta
        : reporte.saldoDisponible > 0
          ? this.colores.verdeExito
          : this.colores.textoSecundario;

    documento.setFont('helvetica', 'normal');
    documento.setTextColor(...colorEstado);

    documento.text(
      this.obtenerEstadoSaldo(reporte.saldoDisponible),
      anchoPagina - this.margenHorizontal - 65,
      posicionY + 12
    );

    return posicionY + 19;
  }

  private agregarCategorias(
    documento: jsPDF,
    titulo: string,
    categorias: DetalleCategoriaFinancieraResponse[],
    colorEncabezado: ColorRgb,
    posicionY: number
  ): number {
    posicionY = this.prepararSeccion(
      documento,
      titulo,
      posicionY
    );

    if (categorias.length === 0) {
      return this.agregarEstadoVacio(
        documento,
        'No hay información por categorías para esta sección.',
        posicionY
      );
    }

    autoTable(documento, {
      startY: posicionY,
      margin: {
        left: this.margenHorizontal,
        right: this.margenHorizontal,
        top: 18,
        bottom: 15,
      },
      head: [
        [
          'Categoría',
          'Movimientos',
          'Participación',
          'Total',
        ],
      ],
      body: categorias.map(categoria => [
        categoria.categoriaNombre || 'Sin categoría',
        categoria.cantidadMovimientos.toString(),
        this.formatearPorcentaje(categoria.porcentajeTotal),
        this.formatearMoneda(categoria.total),
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: this.colores.textoPrincipal,
        lineColor: this.colores.borde,
        lineWidth: 0.2,
        cellPadding: 3,
        valign: 'middle',
      },
      headStyles: {
        fillColor: colorEncabezado,
        textColor: this.colores.blanco,
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: this.colores.fondoClaro,
      },
      columnStyles: {
        0: {
          cellWidth: 'auto',
        },
        1: {
          cellWidth: 38,
          halign: 'center',
        },
        2: {
          cellWidth: 38,
          halign: 'right',
        },
        3: {
          cellWidth: 55,
          halign: 'right',
          fontStyle: 'bold',
        },
      },
    });

    return this.obtenerPosicionFinalTabla(documento);
  }

  private agregarMovimientos(
    documento: jsPDF,
    titulo: string,
    movimientos: MovimientoFinancieroResponse[],
    colorEncabezado: ColorRgb,
    posicionY: number
  ): number {
    posicionY = this.prepararSeccion(
      documento,
      titulo,
      posicionY
    );

    if (movimientos.length === 0) {
      return this.agregarEstadoVacio(
        documento,
        'No hay movimientos registrados para esta sección.',
        posicionY
      );
    }

    autoTable(documento, {
      startY: posicionY,
      margin: {
        left: this.margenHorizontal,
        right: this.margenHorizontal,
        top: 18,
        bottom: 15,
      },
      head: [
        [
          'Fecha',
          'Categoría',
          'Concepto',
          'Descripción',
          'Tercero',
          'Referencia',
          'Estado',
          'Valor',
        ],
      ],
      body: movimientos.map(movimiento => [
        this.formatearFecha(movimiento.fecha),
        movimiento.categoriaNombre || 'Sin categoría',
        movimiento.concepto || 'Sin concepto',
        movimiento.descripcion || '—',
        movimiento.tercero || '—',
        movimiento.referencia || '—',
        movimiento.estado || 'Sin estado',
        this.formatearMoneda(movimiento.valor),
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 6.8,
        textColor: this.colores.textoPrincipal,
        lineColor: this.colores.borde,
        lineWidth: 0.15,
        cellPadding: 2.2,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: colorEncabezado,
        textColor: this.colores.blanco,
        fontStyle: 'bold',
        halign: 'left',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: this.colores.fondoClaro,
      },
      columnStyles: {
        0: {
          cellWidth: 22,
        },
        1: {
          cellWidth: 29,
        },
        2: {
          cellWidth: 38,
        },
        3: {
          cellWidth: 48,
        },
        4: {
          cellWidth: 30,
        },
        5: {
          cellWidth: 27,
        },
        6: {
          cellWidth: 23,
          halign: 'center',
        },
        7: {
          cellWidth: 37,
          halign: 'right',
          fontStyle: 'bold',
        },
      },
      didParseCell: data => {
        if (
          data.section === 'body' &&
          data.column.index === 6
        ) {
          const estado = String(data.cell.raw ?? '')
            .trim()
            .toLowerCase();

          if (
            estado === 'anulado' ||
            estado === 'cancelado'
          ) {
            data.cell.styles.textColor =
              this.colores.rojoAlerta;
            data.cell.styles.fontStyle = 'bold';
          }

          if (
            estado === 'activo' ||
            estado === 'registrado'
          ) {
            data.cell.styles.textColor =
              this.colores.verdeExito;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    return this.obtenerPosicionFinalTabla(documento);
  }

  private prepararSeccion(
    documento: jsPDF,
    titulo: string,
    posicionY: number
  ): number {
    posicionY = this.verificarEspacio(
      documento,
      posicionY,
      28
    );

    documento.setFillColor(...this.colores.azulOscuro);
    documento.roundedRect(
      this.margenHorizontal,
      posicionY,
      4,
      8,
      1,
      1,
      'F'
    );

    documento.setTextColor(...this.colores.textoPrincipal);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(12);

    documento.text(
      titulo,
      this.margenHorizontal + 8,
      posicionY + 6
    );

    return posicionY + 11;
  }

  private agregarEstadoVacio(
    documento: jsPDF,
    mensaje: string,
    posicionY: number
  ): number {
    const anchoPagina = documento.internal.pageSize.getWidth();
    const anchoDisponible =
      anchoPagina - this.margenHorizontal * 2;

    documento.setFillColor(...this.colores.fondoClaro);
    documento.setDrawColor(...this.colores.borde);

    documento.roundedRect(
      this.margenHorizontal,
      posicionY,
      anchoDisponible,
      15,
      2,
      2,
      'FD'
    );

    documento.setFont('helvetica', 'normal');
    documento.setFontSize(8);
    documento.setTextColor(...this.colores.textoSecundario);

    documento.text(
      mensaje,
      this.margenHorizontal + 5,
      posicionY + 9
    );

    return posicionY + 15;
  }

  private verificarEspacio(
    documento: jsPDF,
    posicionY: number,
    espacioNecesario: number
  ): number {
    const altoPagina = documento.internal.pageSize.getHeight();
    const limiteInferior = altoPagina - 18;

    if (posicionY + espacioNecesario <= limiteInferior) {
      return posicionY;
    }

    documento.addPage();

    this.agregarEncabezadoSecundario(documento);

    return 24;
  }

  private agregarEncabezadoSecundario(
    documento: jsPDF
  ): void {
    const anchoPagina = documento.internal.pageSize.getWidth();

    documento.setFillColor(...this.colores.azulOscuro);
    documento.rect(0, 0, anchoPagina, 14, 'F');

    documento.setTextColor(...this.colores.blanco);
    documento.setFont('helvetica', 'bold');
    documento.setFontSize(9);

    documento.text(
      'HabitaControl · Reporte financiero',
      this.margenHorizontal,
      9
    );
  }

  private agregarPaginacion(documento: jsPDF): void {
    const totalPaginas = documento.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      documento.setPage(pagina);

      const anchoPagina =
        documento.internal.pageSize.getWidth();

      const altoPagina =
        documento.internal.pageSize.getHeight();

      documento.setDrawColor(...this.colores.borde);
      documento.line(
        this.margenHorizontal,
        altoPagina - 10,
        anchoPagina - this.margenHorizontal,
        altoPagina - 10
      );

      documento.setFont('helvetica', 'normal');
      documento.setFontSize(7);
      documento.setTextColor(...this.colores.textoSecundario);

      documento.text(
        'Documento generado automáticamente por HabitaControl',
        this.margenHorizontal,
        altoPagina - 5
      );

      documento.text(
        `Página ${pagina} de ${totalPaginas}`,
        anchoPagina - this.margenHorizontal,
        altoPagina - 5,
        { align: 'right' }
      );
    }
  }

  private obtenerPosicionFinalTabla(
    documento: jsPDF
  ): number {
    const documentoConTabla = documento as jsPDF & {
      lastAutoTable?: {
        finalY: number;
      };
    };

    return documentoConTabla.lastAutoTable?.finalY ?? 20;
  }

  private descargar(
    documento: jsPDF,
    reporte: ReporteFinancieroResponse
  ): void {
    const periodo = this.normalizarNombreArchivo(
      reporte.periodoTexto ||
        this.obtenerPeriodoAlternativo(reporte)
    );

    documento.save(
      `reporte-financiero-${periodo}-${reporte.anio}.pdf`
    );
  }

  private obtenerPeriodoAlternativo(
    reporte: ReporteFinancieroResponse
  ): string {
    switch (reporte.tipoPeriodo) {
      case 'mensual':
        return reporte.mes
          ? `${this.obtenerNombreMes(reporte.mes)} de ${reporte.anio}`
          : `Reporte mensual ${reporte.anio}`;

      case 'trimestral':
        return reporte.trimestre
          ? `Trimestre ${reporte.trimestre} de ${reporte.anio}`
          : `Reporte trimestral ${reporte.anio}`;

      case 'semestral':
        return reporte.semestre
          ? `Semestre ${reporte.semestre} de ${reporte.anio}`
          : `Reporte semestral ${reporte.anio}`;

      case 'anual':
        return `Año ${reporte.anio}`;

      default:
        return `Periodo ${reporte.anio}`;
    }
  }

  private obtenerNombreMes(mes: number): string {
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    return meses[mes - 1] ?? `Mes ${mes}`;
  }

  private obtenerEstadoSaldo(saldo: number): string {
    if (saldo > 0) {
      return 'Saldo positivo';
    }

    if (saldo < 0) {
      return 'Déficit financiero';
    }

    return 'Balance equilibrado';
  }

  private obtenerTextoMovimientos(cantidad: number): string {
    return cantidad === 1
      ? 'movimiento'
      : 'movimientos';
  }

  private formatearMoneda(valor: number): string {
    const valorSeguro =
      typeof valor === 'number' && Number.isFinite(valor)
        ? valor
        : 0;

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valorSeguro);
  }

  private formatearPorcentaje(valor: number): string {
    const valorSeguro =
      typeof valor === 'number' && Number.isFinite(valor)
        ? valor
        : 0;

    return `${valorSeguro.toLocaleString('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}%`;
  }

  private formatearFecha(
    fecha: string | Date | null | undefined
  ): string {
    if (!fecha) {
      return 'Sin fecha';
    }

    const fechaConvertida =
      fecha instanceof Date
        ? fecha
        : new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return 'Fecha inválida';
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(fechaConvertida);
  }

  private formatearFechaHora(fecha: Date): string {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Bogota',
    }).format(fecha);
  }

  private normalizarNombreArchivo(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}