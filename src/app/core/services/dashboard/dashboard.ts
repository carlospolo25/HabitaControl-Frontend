import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../config/api.config';

export interface DashboardOverviewResponse {
  activePersons: number;
  currentVisitors: number;
  pendingPackages: number;
  pendingNews: number;
  todayReservations: number;
  pendingInvitations: number;
}

export interface DashboardNewsItemResponse {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

export interface DashboardTodayActivityResponse {
  todayVisitors: number;
  currentVisitors: number;
  visitorsWithoutExitMoreThanOneDay: number;
  todayReservations: number;
  todayPackages: number;
  yesterdayPackages: number;
  pendingPackages: number;
  pendingPackagesMoreThanTwoDays: number;
  hasVisitorsWithoutExitAlert: boolean;
  hasOldPackagesAlert: boolean;
  requiresAttention: boolean;
  mainMessage: string;
}

export interface DashboardNewsOperationalResponse {
  totalPendingNews: number;
  totalOperationalNews: number;
  totalManagementPendingNews: number;
  hasPendingNews: boolean;
  mainMessage: string;
  operationalNews: DashboardNewsItemResponse[];
  managementNews: DashboardNewsItemResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class Dashboard {
 private readonly api =
  API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  togglePersonStatus(personId: string): Observable<any> {
    return this.http.put(
      `${this.api}/Dashboard/person/${personId}/toggle-status`,
      {}
    );
  }

  getOverview(): Observable<DashboardOverviewResponse> {
    return this.http.get<DashboardOverviewResponse>(
      `${this.api}/Dashboard/overview`
    );
  }

  getNewsOperationalSummary(): Observable<DashboardNewsOperationalResponse> {
    return this.http.get<DashboardNewsOperationalResponse>(
      `${this.api}/Dashboard/news-operational-summary`
    );
  }

  getTodayActivity(): Observable<DashboardTodayActivityResponse> {
    return this.http.get<DashboardTodayActivityResponse>(
      `${this.api}/Dashboard/today-activity`
    );
  }
}