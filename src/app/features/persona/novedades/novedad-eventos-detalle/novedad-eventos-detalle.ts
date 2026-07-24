import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { finalize } from 'rxjs';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import {
  EventoNovedad,
  NovedadService,
  ExpedienteNovedadResponse,
} from '../../../../core/services/novedad/novedad';

@Component({
  selector: 'app-novedad-eventos-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './novedad-eventos-detalle.html',
  styleUrl: './novedad-eventos-detalle.css',
})
export class NovedadEventosDetalle implements OnChanges {
  @Input() novedadId = '';
  @Output() cerrar = new EventEmitter<void>();

  eventos: EventoNovedad[] = [];

  isLoading = false;
  errorMessage = '';
  expediente?: ExpedienteNovedadResponse;
  isGeneratingPdf = false;

  constructor(
    private readonly novedadService: NovedadService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['novedadId'] && this.novedadId) {
      this.cargarEventos();
    }
  }

  get responsableNovedad(): string {
    return (
      this.eventos.find(e => e.tipo === 'Asignacion')?.registradoPor ||
      ''
    );
  }

  get fechaApertura(): string | Date | null {
    return this.eventos[0]?.fechaCreacion ?? null;
  }

  get fechaCierre(): string | Date | null {
    return (
      this.eventos.find(e => e.tipo === 'Cierre' || e.tipo === 'Finalizacion')
        ?.fechaCreacion ?? null
    );
  }

  cargarEventos(): void {
    if (!this.novedadId) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.detectChanges();

    this.novedadService
      .obtenerEventos(this.novedadId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          this.eventos = Array.isArray(response) ? response : [];
        },
        error: (err: any) => {
          this.eventos = [];
          this.errorMessage =
            err?.error?.mensaje ??
            err?.error?.message ??
            err?.message ??
            'No fue posible cargar los eventos de la novedad.';
        },
      });
  }

  exportarPdf(): void {
    if (this.isGeneratingPdf || !this.novedadId) {
      return;
    }

    this.isGeneratingPdf = true;
    this.errorMessage = '';

    this.novedadService
      .obtenerExpediente(this.novedadId)
      .pipe(
        finalize(() => {
          this.isGeneratingPdf = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.expediente = response;
          this.generarPdf(response);
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message ??
            err?.error?.mensaje ??
            err?.message ??
            'No fue posible obtener el expediente.';
        },
      });
  }

  private generarPdf(expediente: ExpedienteNovedadResponse): void {
    const doc = new jsPDF('p', 'mm', 'a4');

    const numeroExpediente = this.obtenerNumeroExpediente(expediente);
    let currentY = 20;

    currentY = this.dibujarEncabezadoPdf(doc, expediente, numeroExpediente, currentY);
    currentY = this.dibujarInformacionGeneralPdf(doc, expediente, currentY);
    currentY = this.dibujarBitacoraPdf(doc, expediente, currentY);

    this.dibujarPiePaginaPdf(doc, expediente);
    this.guardarPdf(doc, numeroExpediente);
  }

  private obtenerNumeroExpediente(expediente: ExpedienteNovedadResponse): string {
    const year = new Date(expediente.fechaApertura).getFullYear();
    const shortId = expediente.novedadId.substring(0, 8).toUpperCase();

    return `EXP-${year}-${shortId}`;
  }

  private formatPdfDate(value?: string | null): string {
    if (!value) {
      return 'Pendiente';
    }

    return new Date(value).toLocaleString('es-CO');
  }

  private dibujarEncabezadoPdf(
    doc: jsPDF,
    expediente: ExpedienteNovedadResponse,
    numeroExpediente: string,
    currentY: number
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(
      (expediente.nombreConjunto || 'Conjunto residencial').toUpperCase(),
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );

    currentY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Sistema de Gestión Residencial', pageWidth / 2, currentY, {
      align: 'center',
    });

    currentY += 12;

    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);

    currentY += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('EXPEDIENTE OFICIAL DE NOVEDAD', pageWidth / 2, currentY, {
      align: 'center',
    });

    currentY += 9;

    doc.setFontSize(10);
    doc.text(`Expediente No. ${numeroExpediente}`, pageWidth / 2, currentY, {
      align: 'center',
    });

    currentY += 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(expediente.titulo || 'Novedad sin título', marginX, currentY);

    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const descripcion = expediente.descripcion || 'Sin descripción inicial.';
    const descripcionLines = doc.splitTextToSize(
      descripcion,
      pageWidth - marginX * 2
    );

    doc.text(descripcionLines, marginX, currentY);

    return currentY + descripcionLines.length * 5 + 10;
  }

  private dibujarInformacionGeneralPdf(
    doc: jsPDF,
    expediente: ExpedienteNovedadResponse,
    currentY: number
  ): number {
    const marginX = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INFORMACIÓN GENERAL', marginX, currentY);

    currentY += 8;

    const rows = [
      ['Estado', expediente.estado || '—'],
      ['Tipo', expediente.tipo || '—'],
      ['Reportada por', expediente.reportadaPor || '—'],
      ['Responsable', expediente.responsable || 'Sin asignar'],
      ['Fecha de apertura', this.formatPdfDate(expediente.fechaApertura)],
      ['Fecha de cierre', this.formatPdfDate(expediente.fechaCierre)],
      ['Fecha de generación', this.formatPdfDate(expediente.fechaGeneracion)],
    ];

    doc.setFontSize(10);

    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, marginX, currentY);

      doc.setFont('helvetica', 'normal');
      doc.text(value, marginX + 42, currentY);

      currentY += 7;
    });

    return currentY + 6;
  }

  private dibujarBitacoraPdf(
    doc: jsPDF,
    expediente: ExpedienteNovedadResponse,
    currentY: number
  ): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('BITÁCORA DE ACTUACIONES', marginX, currentY);

    currentY += 8;

    expediente.eventos.forEach((evento, index) => {
      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = 20;
      }

      doc.setDrawColor(180);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);

      currentY += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(
        `REGISTRO ${(index + 1).toString().padStart(3, '0')}`,
        marginX,
        currentY
      );

      doc.setFont('helvetica', 'normal');
      doc.text(this.formatPdfDate(evento.fechaCreacion), pageWidth - marginX, currentY, {
        align: 'right',
      });

      currentY += 8;

      doc.setFont('helvetica', 'bold');
      doc.text('Tipo:', marginX, currentY);

      doc.setFont('helvetica', 'normal');
      doc.text(evento.tipo || 'Actualización', marginX + 22, currentY);

      currentY += 8;

      const comentario = evento.comentario || 'Sin comentario registrado.';
      const comentarioLines = doc.splitTextToSize(
        comentario,
        pageWidth - marginX * 2
      );

      doc.text(comentarioLines, marginX, currentY);
      currentY += comentarioLines.length * 5 + 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `Registrado por: ${evento.registradoPor || '—'}`,
        marginX,
        currentY
      );

      currentY += 6;

      if (evento.imagenUrl) {
        doc.text('Evidencia: imagen adjunta disponible', marginX, currentY);
        currentY += 6;
      }

      currentY += 4;
    });

    return currentY;
  }

  private dibujarPiePaginaPdf(
    doc: jsPDF,
    expediente: ExpedienteNovedadResponse
  ): void {
    const totalPages = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      doc.text(
        `Documento generado automáticamente por HabitaControl · ${this.formatPdfDate(expediente.fechaGeneracion)}`,
        marginX,
        pageHeight - 12
      );

      doc.text(`Página ${i} de ${totalPages}`, 190, pageHeight - 12, {
        align: 'right',
      });
    }
  }

  private guardarPdf(doc: jsPDF, numeroExpediente: string): void {
    doc.save(`${numeroExpediente}.pdf`);
  }

  volver(): void {
    console.log('EVENTOS DETALLE - volver');
    this.cerrar.emit();
  }
}