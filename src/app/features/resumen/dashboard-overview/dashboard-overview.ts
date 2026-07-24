import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import {
  Dashboard,
  DashboardOverviewResponse,
  DashboardNewsOperationalResponse,
  DashboardTodayActivityResponse,
} from '../../../core/services/dashboard/dashboard';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-overview.html',
  styleUrl: './dashboard-overview.css',
})
export class DashboardOverview implements OnInit {
  overview: DashboardOverviewResponse | null = null;
  newsSummary: DashboardNewsOperationalResponse | null = null;
  todayActivity: DashboardTodayActivityResponse | null = null;

  loadingOverview = false;
  loadingNews = false;
  loadingToday = false;

  overviewError = '';
  newsError = '';
  todayError = '';

  constructor(
    private dashboardService: Dashboard,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get isLoading(): boolean {
    return this.loadingOverview || this.loadingNews || this.loadingToday;
  }

  get hasData(): boolean {
    return !!(this.overview || this.newsSummary || this.todayActivity);
  }

  get hasErrors(): boolean {
    return !!(this.overviewError || this.newsError || this.todayError);
  }

  loadDashboard(): void {
    this.clearDashboard();
    this.clearErrors();

    this.loadOverview();
    this.loadNewsSummary();
    this.loadTodayActivity();
  }

  retry(): void {
    this.loadDashboard();
  }

  private loadOverview(): void {
    this.loadingOverview = true;

    this.dashboardService
      .getOverview()
      .pipe(
        finalize(() => {
          this.loadingOverview = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.overview = response;
        },
        error: (error) => {
          this.overviewError = this.getErrorMessage(error);
        },
      });
  }

  private loadNewsSummary(): void {
    this.loadingNews = true;

    this.dashboardService
      .getNewsOperationalSummary()
      .pipe(
        finalize(() => {
          this.loadingNews = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.newsSummary = response;
        },
        error: (error) => {
          this.newsError = this.getErrorMessage(error);
        },
      });
  }

  private loadTodayActivity(): void {
    this.loadingToday = true;

    this.dashboardService
      .getTodayActivity()
      .pipe(
        finalize(() => {
          this.loadingToday = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.todayActivity = response;
        },
        error: (error) => {
          this.todayError = this.getErrorMessage(error);
        },
      });
  }

  private clearDashboard(): void {
    this.overview = null;
    this.newsSummary = null;
    this.todayActivity = null;
  }

  private clearErrors(): void {
    this.overviewError = '';
    this.newsError = '';
    this.todayError = '';
  }

  private getErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.status === 0) {
      return 'No fue posible conectar con el servidor. Verifica tu conexión e intenta nuevamente.';
    }

    if (error?.status === 401) {
      return 'Tu sesión ha expirado. Inicia sesión nuevamente.';
    }

    if (error?.status === 403) {
      return 'No tienes permisos para ver esta información.';
    }

    if (error?.status === 404) {
      return 'No se encontró la información solicitada.';
    }

    return 'Ocurrió un error al cargar esta sección. Intenta nuevamente.';
  }
}