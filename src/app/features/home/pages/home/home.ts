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

interface HomeModule {
  icon: string;
  title: string;
  description: string;
  image: string;
}

interface HomeBenefit {
  icon: string;
  title: string;
  description: string;
}

interface HomeStep {
  number: number;
  title: string;
  description: string;
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
  loginMenuOpen: 'navbar' | 'hero' | null = null;

  readonly features: HomeFeature[] = [
    {
      title: 'Gestión de residentes',
      description:
        'Administra propietarios, residentes, personal de seguridad y mantenimiento desde un único lugar, con filtros, permisos y seguimiento completo.',
      image: 'assets/brand/home/personas.png',
      alt: 'Vista del módulo de gestión de residentes de SincroHabit',
    },
    {
      title: 'Control de visitantes',
      description:
        'Registra ingresos y salidas, autoriza visitantes y agiliza el acceso mediante invitaciones seguras con código QR.',
      image: 'assets/brand/home/visitantes.png',
      alt: 'Vista del módulo de control de visitantes de SincroHabit',
    },
    {
      title: 'Gestión de paquetes',
      description:
        'Registra paquetes recibidos, consulta su estado y notifica oportunamente a los residentes hasta completar la entrega.',
      image: 'assets/brand/home/paquetes.png',
      alt: 'Vista del módulo de gestión de paquetes de SincroHabit',
    },
    {
      title: 'Zonas comunes y reservas',
      description:
        'Administra zonas comunes, disponibilidad y reservas, ofreciendo a los residentes un proceso organizado y transparente.',
      image: 'assets/brand/home/reservas.png',
      alt: 'Vista del módulo de zonas comunes y reservas de SincroHabit',
    },
    {
      title: 'Novedades operativas',
      description:
        'Registra incidencias, asigna responsables y consulta el historial completo de cada novedad hasta su cierre.',
      image: 'assets/brand/home/novedades.png',
      alt: 'Vista del módulo de novedades operativas de SincroHabit',
    },
    {
      title: 'Mascotas',
      description:
        'Mantén actualizado el registro de mascotas vinculados con cada vivienda y sus residentes.',
      image: 'assets/brand/home/mascotas.png',
      alt: 'Vista de los módulos de vehículos y mascotas de SincroHabit',
    },
        {
      title: 'Vehiculos',
      description:
        'Mantén actualizado el registro de vehículos vinculados con cada vivienda y sus residentes.',
      image: 'assets/brand/home/mascotas.png',
      alt: 'Vista de los módulos de vehículos y mascotas de SincroHabit',
    },
    {
      title: 'Gestión financiera',
      description:
        'Organiza ingresos, egresos y categorías financieras para conservar un control claro de los recursos del conjunto residencial.',
      image: 'assets/brand/home/finanzas.png',
      alt: 'Vista del módulo de gestión financiera de SincroHabit',
    },
  ];

  readonly modules: HomeModule[] = [
    {
      icon: '👥',
      title: 'Visitantes',
      description:
        'Registra y controla ingresos y salidas de visitantes con mayor trazabilidad.',
      image: 'assets/brand/home/visitantes.png',
    },
    {
      icon: '📦',
      title: 'Paquetes',
      description:
        'Gestiona la recepción, seguimiento y entrega de paquetes a residentes.',
      image: 'assets/brand/home/paquetes.png',
    },
    {
      icon: '👤',
      title: 'Personas',
      description:
        'Centraliza residentes, seguridad, mantenimiento y personal autorizado.',
      image: 'assets/brand/home/personas.png',
    },
    {
      icon: '📢',
      title: 'Avisos',
      description:
        'Comunica información importante a los miembros de la comunidad.',
      image: 'assets/brand/home/avisos.png',
    },
    {
      icon: '📋',
      title: 'Normatividad',
      description:
        'Mantén disponibles normas y lineamientos de convivencia.',
      image: 'assets/brand/home/normatividad.png',
    },
    {
      icon: '🛠',
      title: 'Novedades',
      description:
        'Registra incidencias, responsables, evidencias y seguimiento.',
      image: 'assets/brand/home/novedades.png',
    },
    {
      icon: '📅',
      title: 'Reservas',
      description:
        'Gestiona zonas comunes, disponibilidad y reservas.',
      image: 'assets/brand/home/reservas.png',
    },
    {
      icon: '🚗',
      title: 'Vehículos',
      description:
        'Controla los vehículos asociados a residentes y viviendas.',
      image: 'assets/brand/home/vehiculos.png',
    },
    {
      icon: '🐾',
      title: 'Mascotas',
      description:
        'Mantén actualizado el registro de mascotas de la comunidad.',
      image: 'assets/brand/home/mascotas.png',
    },
    {
      icon: '📊',
      title: 'Finanzas',
      description:
        'Organiza ingresos, egresos, categorías y reportes financieros.',
      image: 'assets/brand/home/finanzas.png',
    },
  ];

  readonly benefits: HomeBenefit[] = [
    {
      icon: '🛡️',
      title: 'Mayor seguridad',
      description:
        'Control de accesos, permisos por rol y seguimiento de las operaciones.',
    },
    {
      icon: '📣',
      title: 'Comunicación efectiva',
      description:
        'Mantén informada a la comunidad desde una sola plataforma.',
    },
    {
      icon: '⚙️',
      title: 'Procesos más simples',
      description:
        'Centraliza tareas y reduce procesos gestionados por separado.',
    },
    {
      icon: '📈',
      title: 'Información organizada',
      description:
        'Consulta datos y registros importantes de manera estructurada',
    },
    {
      icon: '🏡',
      title: 'Mejor convivencia',
      description:
        'Facilita una administración más organizada, transparente y conectada.',
    },
  ];

  readonly steps: HomeStep[] = [
    {
      number: 1,
      title: 'Crea tu cuenta',
      description:
        'Registra tu conjunto residencial y configura tu cuenta administrativa.',
    },
    {
      number: 2,
      title: 'Invita a tu comunidad',
      description:
        'Envía invitaciones a residentes, seguridad y personal para que completen su registro.',
    },
    {
      number: 3,
      title: 'Gestiona y controla',
      description:
        'Utiliza los módulos disponibles según las necesidades del conjunto.',
    },
    {
      number: 4,
      title: 'Centraliza la operación',
      description:
        'Mantén la información y los procesos principales en un solo lugar.',
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

  toggleLoginMenu(menu: 'navbar' | 'hero'): void {
    this.loginMenuOpen =
      this.loginMenuOpen === menu
        ? null
        : menu;
  }

  closeLoginMenu(): void {
    this.loginMenuOpen = null;
  }

  goToAdminLogin(): void {
    this.closeLoginMenu();
    this.router.navigate(['/login']);
  }

  goToPersonaLogin(): void {
    this.closeLoginMenu();
    this.router.navigate(['/loginPersona']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  scrollToSection(sectionId: string): void {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
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

    const swipeDistance =
      this.touchEndX - this.touchStartX;

    if (
      Math.abs(swipeDistance) >=
      this.minimumSwipeDistance
    ) {
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

  private changeFeature(
    index: number,
    restartAutoplay: boolean
  ): void {
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

    this.currentFeatureIndex = index;

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
        this.currentFeatureIndex ===
        this.features.length - 1
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