import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnDestroy,
  Output,
} from '@angular/core';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@Component({
  selector: 'app-scanner-qr-visitante',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  templateUrl: './scanner-qr-visitante.html',
  styleUrl: './scanner-qr-visitante.css',
})
export class ScannerQrVisitante implements OnDestroy {
  @Output() tokenDetectado = new EventEmitter<string>();
  @Output() cerrar = new EventEmitter<void>();

  scannerEnabled = true;
  qrLeido = false;
  errorMessage = '';

  camaras: MediaDeviceInfo[] = [];
  camaraSeleccionada?: MediaDeviceInfo;

  onCodeResult(result: string): void {
    if (!result || this.qrLeido) {
      return;
    }

    const token = this.extraerToken(result);

    if (!token) {
      this.errorMessage =
        'El código QR no contiene una invitación válida.';
      return;
    }

    this.qrLeido = true;
    this.scannerEnabled = false;
    this.errorMessage = '';

    this.tokenDetectado.emit(token);
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.camaras = devices ?? [];

    if (this.camaras.length === 0) {
      this.errorMessage =
        'No se encontró una cámara disponible en este dispositivo.';
      return;
    }

    this.errorMessage = '';
    this.camaraSeleccionada =
      this.buscarCamaraTrasera(this.camaras) ?? this.camaras[0];
  }

  onPermissionResponse(hasPermission: boolean): void {
    if (!hasPermission) {
      this.scannerEnabled = false;
      this.errorMessage =
        'Debes permitir el acceso a la cámara para escanear el código QR.';
      return;
    }

    this.errorMessage = '';
  }

  onScanError(error: unknown): void {
    this.scannerEnabled = false;

    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          this.errorMessage =
            'El acceso a la cámara fue rechazado. Habilítalo en los permisos del navegador.';
          return;

        case 'NotFoundError':
          this.errorMessage =
            'No se encontró una cámara disponible.';
          return;

        case 'NotReadableError':
          this.errorMessage =
            'La cámara está siendo utilizada por otra aplicación.';
          return;

        case 'OverconstrainedError':
          this.errorMessage =
            'La cámara seleccionada no es compatible con la configuración solicitada.';
          return;
      }
    }

    this.errorMessage =
      'No fue posible iniciar la cámara. Intenta nuevamente.';
  }

  cambiarCamara(deviceId: string): void {
    const camara = this.camaras.find(
      dispositivo => dispositivo.deviceId === deviceId
    );

    if (!camara) {
      return;
    }

    this.camaraSeleccionada = camara;
    this.reintentar();
  }

  reintentar(): void {
    this.errorMessage = '';
    this.qrLeido = false;

    this.scannerEnabled = false;

    setTimeout(() => {
      this.scannerEnabled = true;
    });
  }

  cerrarScanner(): void {
    this.scannerEnabled = false;
    this.cerrar.emit();
  }

  ngOnDestroy(): void {
    this.scannerEnabled = false;
  }

  private buscarCamaraTrasera(
    devices: MediaDeviceInfo[]
  ): MediaDeviceInfo | undefined {
    return devices.find(device => {
      const label = device.label.toLowerCase();

      return (
        label.includes('back') ||
        label.includes('rear') ||
        label.includes('environment') ||
        label.includes('trasera')
      );
    });
  }

  private extraerToken(value: string): string {
    const contenido = value.trim();

    if (!contenido) {
      return '';
    }

    try {
      const url = new URL(contenido);
      const tokenUrl = url.searchParams.get('token')?.trim();

      return this.esTokenValido(tokenUrl) ? tokenUrl! : '';
    } catch {
      return this.esTokenValido(contenido) ? contenido : '';
    }
  }

  private esTokenValido(token: string | null | undefined): boolean {
    if (!token) {
      return false;
    }

    return /^[a-fA-F0-9]{32}$/.test(token.trim());
  }
}