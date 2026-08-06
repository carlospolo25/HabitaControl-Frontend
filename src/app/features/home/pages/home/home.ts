import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

interface HomeFeature {
  title: string;
  description: string;
  image: string;
  alt: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);

  private readonly autoplayIntervalMs = 6000;
  private readonly transitionDurationMs = 420;
  private readonly minimumSwipeDistance = 50;

  private autoplayTimer: ReturnType<typeof setInterval> | null = null;
  private transitionTimer: ReturnType<typeof setTimeout> | null = null;

  private touchStartX = 0;
  private touchEndX = 0;

  private isPointerOverCarousel = false;
  private isCarouselFocused = false;
  private isDocumentHidden = false;

  currentFeatureIndex = 0;
  isChanging = false;

  readonly features: HomeFeature[] = [
    {
      title: 'Gestión de residentes',
      description:
        'Administra propietarios, residentes, personal de seguridad y mantenimiento desde un único lugar, con filtros, permisos y seguimiento completo.',
      image: 'assets/brand/home/residentes.png',
      alt: 'Vista del módulo de gestión de residentes de HabitaControl',
    },
    {
      title: 'Control de visitantes',
      description:
        'Registra ingresos y salidas, autoriza visitantes y agiliza el acceso mediante invitaciones seguras con código QR.',
      image: 'assets/brand/home/visitantes.png',
      alt: 'Vista del módulo de control de visitantes de HabitaControl',
    },
    {
      title: 'Gestión de paquetes',
      description:
        'Registra paquetes recibidos, consulta su estado y notifica oportunamente a los residentes hasta completar la entrega.',
      image: 'assets/brand/home/paquetes.png',
      alt: 'Vista del módulo de gestión de paquetes de HabitaControl',
    },
    {
      title: 'Zonas comunes y reservas',
      description:
        'Administra zonas comunes, disponibilidad y reservas, ofreciendo a los residentes un proceso organizado y transparente.',
      image: 'assets/brand/home/reservas.png',
      alt: 'Vista del módulo de zonas comunes y reservas de HabitaControl',
    },
    {
      title: 'Novedades operativas',
      description:
        'Registra incidencias, asigna responsables y consulta el historial completo de cada novedad hasta su cierre.',
      image: 'assets/brand/home/novedades.png',
      alt: 'Vista del módulo de novedades operativas de HabitaControl',
    },
    {
      title: 'Vehículos y mascotas',
      description:
        'Mantén actualizado el registro de vehículos y mascotas vinculados con cada vivienda y sus residentes.',
      image: 'assets/brand/home/vehiculos-mascotas.png',
      alt: 'Vista de los módulos de vehículos y mascotas de HabitaControl',
    },
    {
      title: 'Gestión financiera',
      description:
        'Organiza ingresos, egresos y categorías financieras para conservar un control claro de los recursos del conjunto residencial.',
      image: 'assets/brand/home/finanzas.png',
      alt: 'Vista del módulo de gestión financiera de HabitaControl',
    },
  ];

  ngOnInit(): void {
    this.isDocumentHidden = document.hidden;
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.clearTransitionTimer();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  previousFeature(): void {
    const previousIndex =
      this.currentFeatureIndex === 0
        ? this.features.length - 1
        : this.currentFeatureIndex - 1;

    this.changeFeature(previousIndex, true);
  }

  nextFeature(): void {
    const nextIndex =
      this.currentFeatureIndex === this.features.length - 1
        ? 0
        : this.currentFeatureIndex + 1;

    this.changeFeature(nextIndex, true);
  }

  selectFeature(index: number): void {
    if (
      index < 0 ||
      index >= this.features.length ||
      index === this.currentFeatureIndex
    ) {
      return;
    }

    this.changeFeature(index, true);
  }

  pauseCarousel(): void {
    this.isPointerOverCarousel = true;
    this.stopAutoplay();
  }

  resumeCarousel(): void {
    this.isPointerOverCarousel = false;
    this.startAutoplay();
  }

  handleCarouselFocusIn(): void {
    this.isCarouselFocused = true;
    this.stopAutoplay();
  }

  handleCarouselFocusOut(event: FocusEvent): void {
    const carousel = event.currentTarget as HTMLElement | null;
    const nextFocusedElement = event.relatedTarget as Node | null;

    if (carousel?.contains(nextFocusedElement)) {
      return;
    }

    this.isCarouselFocused = false;
    this.startAutoplay();
  }

  handleCarouselKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousFeature();
        break;

      case 'ArrowRight':
        event.preventDefault();
        this.nextFeature();
        break;

      case 'Home':
        event.preventDefault();
        this.changeFeature(0, true);
        break;

      case 'End':
        event.preventDefault();
        this.changeFeature(this.features.length - 1, true);
        break;
    }
  }

  handleTouchStart(event: TouchEvent): void {
    const firstTouch = event.changedTouches.item(0);

    if (!firstTouch) {
      return;
    }

    this.touchStartX = firstTouch.clientX;
    this.touchEndX = firstTouch.clientX;

    this.stopAutoplay();
  }

  handleTouchMove(event: TouchEvent): void {
    const currentTouch = event.changedTouches.item(0);

    if (!currentTouch) {
      return;
    }

    this.touchEndX = currentTouch.clientX;
  }

  handleTouchEnd(event: TouchEvent): void {
    const finalTouch = event.changedTouches.item(0);

    if (finalTouch) {
      this.touchEndX = finalTouch.clientX;
    }

    const swipeDistance = this.touchEndX - this.touchStartX;

    if (Math.abs(swipeDistance) >= this.minimumSwipeDistance) {
      if (swipeDistance > 0) {
        this.previousFeature();
      } else {
        this.nextFeature();
      }
    } else {
      this.startAutoplay();
    }

    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  @HostListener('document:visibilitychange')
  handleVisibilityChange(): void {
    this.isDocumentHidden = document.hidden;

    if (this.isDocumentHidden) {
      this.stopAutoplay();
      return;
    }

    this.startAutoplay();
  }

  private changeFeature(index: number, restartAutoplay: boolean): void {
    if (
      index < 0 ||
      index >= this.features.length ||
      index === this.currentFeatureIndex
    ) {
      if (restartAutoplay) {
        this.restartAutoplay();
      }

      return;
    }

    this.clearTransitionTimer();

    /*
    * La información cambia inmediatamente.
    * Así la tarjeta nunca queda vacía esperando un temporizador.
    */
    this.currentFeatureIndex = index;

    /*
    * Reiniciamos la clase de animación.
    */
    this.isChanging = false;

    requestAnimationFrame(() => {
      this.isChanging = true;

      this.transitionTimer = setTimeout(() => {
        this.isChanging = false;
        this.transitionTimer = null;
      }, this.transitionDurationMs);
    });

    if (restartAutoplay) {
      this.restartAutoplay();
    }
  }

  private startAutoplay(): void {
    if (
      this.autoplayTimer ||
      this.features.length <= 1 ||
      this.isPointerOverCarousel ||
      this.isCarouselFocused ||
      this.isDocumentHidden
    ) {
      return;
    }

    this.autoplayTimer = setInterval(() => {
      const nextIndex =
        this.currentFeatureIndex === this.features.length - 1
          ? 0
          : this.currentFeatureIndex + 1;

      this.changeFeature(nextIndex, false);
    }, this.autoplayIntervalMs);
  }

  private stopAutoplay(): void {
    if (!this.autoplayTimer) {
      return;
    }

    clearInterval(this.autoplayTimer);
    this.autoplayTimer = null;
  }

  private restartAutoplay(): void {
    this.stopAutoplay();
    this.startAutoplay();
  }

  private clearTransitionTimer(): void {
    if (!this.transitionTimer) {
      return;
    }

    clearTimeout(this.transitionTimer);
    this.transitionTimer = null;
  }
}