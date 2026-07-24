import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  EntregarPaqueteRequest,
  PaqueteService,
} from '../../../../core/services/paquete/paquete';

@Component({
  selector: 'app-form-entrega-paquete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './form-entrega-paquete.html',
  styleUrl: './form-entrega-paquete.css',
})
export class FormEntregaPaqueteComponent implements AfterViewInit {
  @Input({ required: true }) paqueteId = '';

  @Output() cerrar = new EventEmitter<void>();
  @Output() entregaCompletada = new EventEmitter<void>();

  @ViewChild('firmaCanvas')
  private firmaCanvas!: ElementRef<HTMLCanvasElement>;

  entregadoA = '';

  isSubmitting = false;
  errorMessage = '';

  firmaRealizada = false;

  private dibujando = false;
  private ultimaPosicionX = 0;
  private ultimaPosicionY = 0;

  constructor(
    private readonly paqueteService: PaqueteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.prepararCanvas();
  }

  iniciarFirma(event: PointerEvent): void {
    if (this.isSubmitting) {
      return;
    }

    const canvas = this.firmaCanvas.nativeElement;

    canvas.setPointerCapture(event.pointerId);

    const posicion = this.obtenerPosicion(event);

    this.dibujando = true;
    this.ultimaPosicionX = posicion.x;
    this.ultimaPosicionY = posicion.y;

    event.preventDefault();
  }

  dibujar(event: PointerEvent): void {
    if (!this.dibujando || this.isSubmitting) {
      return;
    }

    const canvas = this.firmaCanvas.nativeElement;
    const contexto = canvas.getContext('2d');

    if (!contexto) {
      return;
    }

    const posicion = this.obtenerPosicion(event);

    contexto.beginPath();
    contexto.moveTo(
      this.ultimaPosicionX,
      this.ultimaPosicionY
    );
    contexto.lineTo(posicion.x, posicion.y);
    contexto.stroke();

    this.ultimaPosicionX = posicion.x;
    this.ultimaPosicionY = posicion.y;

    this.firmaRealizada = true;
    this.errorMessage = '';

    event.preventDefault();
  }

  detenerFirma(event?: PointerEvent): void {
    if (event) {
      const canvas = this.firmaCanvas.nativeElement;

      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    }

    this.dibujando = false;
  }

  limpiarFirma(): void {
    if (this.isSubmitting) {
      return;
    }

    const canvas = this.firmaCanvas.nativeElement;
    const contexto = canvas.getContext('2d');

    contexto?.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    this.firmaRealizada = false;
    this.dibujando = false;
    this.errorMessage = '';
  }

  confirmarEntrega(): void {
    if (this.isSubmitting) {
      return;
    }

    this.errorMessage = '';

    const nombreReceptor = this.entregadoA.trim();

    if (!this.paqueteId) {
      this.errorMessage =
        'No se encontró el identificador del paquete.';
      return;
    }

    if (!nombreReceptor) {
      this.errorMessage =
        'Ingresa el nombre de la persona que recibe el paquete.';
      return;
    }

    if (nombreReceptor.length < 2 || nombreReceptor.length > 150) {
      this.errorMessage =
        'El nombre de quien recibe debe tener entre 2 y 150 caracteres.';
      return;
    }

    if (!this.firmaRealizada) {
      this.errorMessage =
        'La firma de quien recibe el paquete es obligatoria.';
      return;
    }

    const firmaBase64 =
      this.firmaCanvas.nativeElement.toDataURL('image/png');

    const request: EntregarPaqueteRequest = {
      entregadoA: nombreReceptor,
      firmaRecibido: firmaBase64,
    };

    this.isSubmitting = true;

    this.paqueteService
      .entregar(this.paqueteId, request)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.entregaCompletada.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.obtenerMensajeError(
            error,
            'No fue posible registrar la entrega del paquete.'
          );
        },
      });
  }

  cerrarFormulario(): void {
    if (this.isSubmitting) {
      return;
    }

    this.cerrar.emit();
  }

  @HostListener('document:keydown.escape')
  cerrarConEscape(): void {
    this.cerrarFormulario();
  }

  private prepararCanvas(): void {
    const canvas = this.firmaCanvas.nativeElement;
    const contexto = canvas.getContext('2d');

    if (!contexto) {
      this.errorMessage =
        'No fue posible inicializar el área de firma.';
      return;
    }

    contexto.lineWidth = 2;
    contexto.lineCap = 'round';
    contexto.lineJoin = 'round';
    contexto.strokeStyle = '#0F172A';
  }

  private obtenerPosicion(
    event: PointerEvent
  ): { x: number; y: number } {
    const canvas = this.firmaCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * escalaX,
      y: (event.clientY - rect.top) * escalaY,
    };
  }

  private obtenerMensajeError(
    error: HttpErrorResponse,
    mensajePredeterminado: string
  ): string {
    if (error.status === 0) {
      return 'No fue posible conectar con el servidor. Verifica tu conexión e inténtalo nuevamente.';
    }

    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (
      typeof error.error?.message === 'string' &&
      error.error.message.trim()
    ) {
      return error.error.message;
    }

    if (
      typeof error.error?.mensaje === 'string' &&
      error.error.mensaje.trim()
    ) {
      return error.error.mensaje;
    }

    if (
      typeof error.error?.detail === 'string' &&
      error.error.detail.trim()
    ) {
      return error.error.detail;
    }

    if (error.error?.errors) {
      const mensajes = Object.values(error.error.errors)
        .flat()
        .filter(
          (mensaje): mensaje is string =>
            typeof mensaje === 'string'
        );

      if (mensajes.length > 0) {
        return mensajes.join(' ');
      }
    }

    switch (error.status) {
      case 400:
        return 'La información de la entrega no es válida. Revisa los datos ingresados.';

      case 401:
        return 'Tu sesión no es válida o ha expirado. Inicia sesión nuevamente.';

      case 403:
        return 'No tienes permisos para entregar paquetes.';

      case 404:
        return 'El paquete que intentas entregar no fue encontrado.';

      case 409:
        return 'El paquete ya fue entregado o no se encuentra disponible para esta operación.';

      default:
        return mensajePredeterminado;
    }
  }
}