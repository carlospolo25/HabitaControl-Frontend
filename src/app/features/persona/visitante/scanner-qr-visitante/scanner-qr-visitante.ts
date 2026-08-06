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
    const dispositivos = devices ?? [];

    if (dispositivos.length === 0) {
      this.camaras = [];
      this.camaraSeleccionada = undefined;
      this.scannerEnabled = false;

      this.errorMessage =
        'No se encontró una cámara disponible en este dispositivo.';

      return;
    }

    this.camaras = dispositivos;

    /*
    * Si ya existe una cámara seleccionada y sigue disponible,
    * no volvemos a cambiarla.
    */
    if (
      this.camaraSeleccionada &&
      this.camaras.some(
        camara =>
          camara.deviceId ===
          this.camaraSeleccionada?.deviceId
      )
    ) {
      return;
    }

    const camaraFisica =
      this.buscarCamaraFisica(this.camaras);

    this.camaraSeleccionada =
      camaraFisica ?? this.camaras[0];

    this.errorMessage = '';
    this.qrLeido = false;
    this.scannerEnabled = true;

    console.log(
      'Cámara seleccionada:',
      this.camaraSeleccionada?.label
    );
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
    const nuevaCamara = this.camaras.find(
      camara => camara.deviceId === deviceId
    );

    if (!nuevaCamara) {
      this.errorMessage =
        'No fue posible seleccionar la cámara indicada.';

      return;
    }

    this.errorMessage = '';
    this.qrLeido = false;

    /*
    * Detenemos el stream anterior antes de cambiar.
    */
    this.scannerEnabled = false;
    this.camaraSeleccionada = undefined;

    setTimeout(() => {
      this.camaraSeleccionada = nuevaCamara;
      this.scannerEnabled = true;
    }, 200);
  }

  reintentar(): void {
    this.errorMessage = '';
    this.qrLeido = false;

    const camaraActual =
      this.camaraSeleccionada ??
      this.buscarCamaraFisica(this.camaras) ??
      this.camaras[0];

    if (!camaraActual) {
      this.errorMessage =
        'No existe una cámara disponible para reintentar.';

      return;
    }

    this.scannerEnabled = false;
    this.camaraSeleccionada = undefined;

    setTimeout(() => {
      this.camaraSeleccionada = camaraActual;
      this.scannerEnabled = true;
    }, 200);
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

  private buscarCamaraFisica(
    devices: MediaDeviceInfo[]
  ): MediaDeviceInfo | undefined {
    /*
    * Primero descartamos cámaras virtuales.
    */
    const camarasFisicas = devices.filter(device => {
      const label = device.label
        .trim()
        .toLowerCase();

      return (
        !label.includes('virtual') &&
        !label.includes('windows virtual camera') &&
        !label.includes('obs') &&
        !label.includes('droidcam') &&
        !label.includes('manycam') &&
        !label.includes('snap camera')
      );
    });

    if (camarasFisicas.length === 0) {
      return undefined;
    }

    /*
    * Priorizamos cámaras integradas o físicas conocidas.
    */
    return (
      camarasFisicas.find(device => {
        const label = device.label.toLowerCase();

        return (
          label.includes('hp true vision') ||
          label.includes('integrated') ||
          label.includes('built-in') ||
          label.includes('webcam') ||
          label.includes('camera')
        );
      }) ??
      this.buscarCamaraTrasera(camarasFisicas) ??
      camarasFisicas[0]
    );
  }

  private esTokenValido(token: string | null | undefined): boolean {
    if (!token) {
      return false;
    }

    return /^[a-fA-F0-9]{32}$/.test(token.trim());
  }
}