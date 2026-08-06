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
import { finalize, firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../../../../core/config/api.config';
import jsPDF from 'jspdf';

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
  private readonly imagenesConError = new Set<string>();

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

  async exportarPdf(): Promise<void> {
    if (
      this.isGeneratingPdf ||
      !this.novedadId
    ) {
      return;
    }

    this.isGeneratingPdf = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    try {
      const expediente = await firstValueFrom(
        this.novedadService.obtenerExpediente(
          this.novedadId
        )
      );

      this.expediente = expediente;

      await this.generarPdf(expediente);
    } catch (error: any) {
      console.error(
        'Error generando el expediente PDF:',
        error
      );

      this.errorMessage =
        error?.error?.message ??
        error?.error?.mensaje ??
        error?.message ??
        'No fue posible generar el expediente.';
    } finally {
      this.isGeneratingPdf = false;
      this.cdr.detectChanges();
    }
  }

  obtenerImagenUrl(
    imagenUrl: string | null | undefined
  ): string {
    if (!imagenUrl) {
      return '';
    }

    const ruta = imagenUrl.trim();

    if (!ruta) {
      return '';
    }

    if (
      ruta.startsWith('http://') ||
      ruta.startsWith('https://') ||
      ruta.startsWith('data:') ||
      ruta.startsWith('blob:')
    ) {
      return ruta;
    }

    const apiRoot = API_CONFIG.baseUrl.replace(
      /\/api\/?$/i,
      ''
    );

    const rutaNormalizada = ruta.startsWith('/')
      ? ruta
      : `/${ruta}`;

    return `${apiRoot}${rutaNormalizada}`;
  }

  manejarErrorImagen(eventoId: string): void {
    this.imagenesConError.add(eventoId);
    this.cdr.detectChanges();
  }

  imagenConError(eventoId: string): boolean {
    return this.imagenesConError.has(eventoId);
  }

  private async generarPdf(
    expediente: ExpedienteNovedadResponse
  ): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');

    const numeroExpediente =
      this.obtenerNumeroExpediente(expediente);

    let currentY = 20;

    currentY = this.dibujarEncabezadoPdf(
      doc,
      expediente,
      numeroExpediente,
      currentY
    );

    currentY = this.dibujarInformacionGeneralPdf(
      doc,
      expediente,
      currentY
    );

    // 👇 Aquí está la diferencia
    currentY = await this.dibujarBitacoraPdf(
      doc,
      expediente,
      currentY
    );

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

  private async dibujarBitacoraPdf(
    doc: jsPDF,
    expediente: ExpedienteNovedadResponse,
    currentY: number
  ): Promise<number> {
    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    const marginX = 18;
    const limiteInferior = pageHeight - 22;

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(12);

    doc.text(
      'BITÁCORA DE ACTUACIONES',
      marginX,
      currentY
    );

    currentY += 8;

    for (
      let index = 0;
      index < expediente.eventos.length;
      index++
    ) {
      const evento =
        expediente.eventos[index];

      if (currentY > pageHeight - 55) {
        doc.addPage();
        currentY = 20;
      }

      doc.setDrawColor(180);

      doc.line(
        marginX,
        currentY,
        pageWidth - marginX,
        currentY
      );

      currentY += 8;

      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.setFontSize(10);

      doc.text(
        `REGISTRO ${(index + 1)
          .toString()
          .padStart(3, '0')}`,
        marginX,
        currentY
      );

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.text(
        this.formatPdfDate(
          evento.fechaCreacion
        ),
        pageWidth - marginX,
        currentY,
        {
          align: 'right',
        }
      );

      currentY += 8;

      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.text(
        'Tipo:',
        marginX,
        currentY
      );

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.text(
        evento.tipo || 'Actualización',
        marginX + 22,
        currentY
      );

      currentY += 8;

      const comentario =
        evento.comentario ||
        'Sin comentario registrado.';

      const comentarioLines =
        doc.splitTextToSize(
          comentario,
          pageWidth - marginX * 2
        );

      doc.text(
        comentarioLines,
        marginX,
        currentY
      );

      currentY +=
        comentarioLines.length * 5 + 6;

      doc.setFont(
        'helvetica',
        'normal'
      );

      doc.setFontSize(9);

      doc.text(
        `Registrado por: ${
          evento.registradoPor || '—'
        }`,
        marginX,
        currentY
      );

      currentY += 8;

      if (evento.imagenUrl) {
        currentY =
          await this.agregarEvidenciaPdf(
            doc,
            evento.imagenUrl,
            currentY,
            marginX,
            limiteInferior
          );
      }

      currentY += 5;
    }

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

  private async agregarEvidenciaPdf(
    doc: jsPDF,
    imagenUrl: string,
    currentY: number,
    marginX: number,
    limiteInferior: number
  ): Promise<number> {
    const pageWidth =
      doc.internal.pageSize.getWidth();

    const anchoDisponible =
      pageWidth - marginX * 2;

    const altoMaximo = 95;

    try {
      const imagen =
        await this.cargarImagenParaPdf(
          this.obtenerImagenUrl(imagenUrl)
        );

      let anchoImagen =
        anchoDisponible;

      let altoImagen =
        anchoImagen *
        (imagen.height / imagen.width);

      if (altoImagen > altoMaximo) {
        altoImagen = altoMaximo;

        anchoImagen =
          altoImagen *
          (imagen.width / imagen.height);
      }

      const espacioNecesario =
        8 + altoImagen + 8;

      if (
        currentY + espacioNecesario >
        limiteInferior
      ) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont(
        'helvetica',
        'bold'
      );

      doc.setFontSize(9);

      doc.text(
        'EVIDENCIA FOTOGRÁFICA',
        marginX,
        currentY
      );

      currentY += 6;

      const posicionX =
        marginX +
        (anchoDisponible - anchoImagen) / 2;

      doc.setDrawColor(
        203,
        213,
        225
      );

      doc.setFillColor(
        248,
        250,
        252
      );

      doc.roundedRect(
        posicionX - 1,
        currentY - 1,
        anchoImagen + 2,
        altoImagen + 2,
        1.5,
        1.5,
        'FD'
      );

      doc.addImage(
        imagen.dataUrl,
        'JPEG',
        posicionX,
        currentY,
        anchoImagen,
        altoImagen,
        undefined,
        'FAST'
      );

      currentY += altoImagen + 5;

      doc.setFont(
        'helvetica',
        'italic'
      );

      doc.setFontSize(8);

      doc.setTextColor(
        100,
        116,
        139
      );

      doc.text(
        'Evidencia incorporada al registro.',
        marginX,
        currentY
      );

      doc.setTextColor(
        0,
        0,
        0
      );

      return currentY + 5;
    } catch (error) {
      console.error(
        'No fue posible incorporar una evidencia:',
        imagenUrl,
        error
      );

      if (currentY + 14 > limiteInferior) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont(
        'helvetica',
        'italic'
      );

      doc.setFontSize(8);

      doc.setTextColor(
        153,
        27,
        27
      );

      doc.text(
        'La evidencia fotográfica no pudo incorporarse al documento.',
        marginX,
        currentY
      );

      doc.setTextColor(
        0,
        0,
        0
      );

      return currentY + 8;
    }
  }

  private async cargarImagenParaPdf(
    imagenUrl: string
  ): Promise<{
    dataUrl: string;
    width: number;
    height: number;
  }> {

    if (!imagenUrl) {
      throw new Error(
        'La URL de la evidencia está vacía.'
      );
    }

    try {
      const response = await fetch(imagenUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(
          `No fue posible descargar la evidencia. Código ${response.status}.`
        );
      }

      const blob = await response.blob();

      if (!blob.type.startsWith('image/')) {
        throw new Error(
          `El servidor no devolvió una imagen. Content-Type: ${blob.type || 'desconocido'}.`
        );
      }

      if (blob.size === 0) {
        throw new Error(
          'La evidencia descargada está vacía.'
        );
      }

      const dataUrlOriginal =
        await this.convertirBlobADataUrl(blob);

      const imagen =
        await this.cargarElementoImagen(
          dataUrlOriginal
        );

      if (
        imagen.naturalWidth <= 0 ||
        imagen.naturalHeight <= 0
      ) {
        throw new Error(
          'La evidencia no tiene dimensiones válidas.'
        );
      }

      const maxWidth = 1600;
      const maxHeight = 1600;

      const escala = Math.min(
        1,
        maxWidth / imagen.naturalWidth,
        maxHeight / imagen.naturalHeight
      );

      const width = Math.max(
        1,
        Math.round(
          imagen.naturalWidth * escala
        )
      );

      const height = Math.max(
        1,
        Math.round(
          imagen.naturalHeight * escala
        )
      );

      const canvas =
        document.createElement('canvas');

      canvas.width = width;
      canvas.height = height;

      const context =
        canvas.getContext('2d');

      if (!context) {
        throw new Error(
          'No fue posible obtener el contexto del canvas.'
        );
      }

      context.fillStyle = '#ffffff';
      context.fillRect(
        0,
        0,
        width,
        height
      );

      context.drawImage(
        imagen,
        0,
        0,
        width,
        height
      );

      const dataUrl = canvas.toDataURL(
        'image/jpeg',
        0.82
      );

      console.groupEnd();

      return {
        dataUrl,
        width,
        height,
      };
    } catch (error) {
      throw error;
    }
  }

  private convertirBlobADataUrl(
    blob: Blob
  ): Promise<string> {
    return new Promise(
      (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (
            typeof reader.result === 'string'
          ) {
            resolve(reader.result);
            return;
          }

          reject(
            new Error(
              'No fue posible leer la evidencia.'
            )
          );
        };

        reader.onerror = () => {
          reject(
            new Error(
              'Ocurrió un error leyendo la evidencia.'
            )
          );
        };

        reader.readAsDataURL(blob);
      }
    );
  }

  private cargarElementoImagen(
    dataUrl: string
  ): Promise<HTMLImageElement> {
    return new Promise(
      (resolve, reject) => {
        const imagen = new Image();

        imagen.onload = () => {
          resolve(imagen);
        };

        imagen.onerror = () => {
          reject(
            new Error(
              'El archivo de evidencia no es una imagen válida.'
            )
          );
        };

        imagen.src = dataUrl;
      }
    );
  }

  volver(): void {
    console.log('EVENTOS DETALLE - volver');
    this.cerrar.emit();
  }
}