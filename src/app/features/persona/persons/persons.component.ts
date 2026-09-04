import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { PersonResponse, PersonService} from '../../../core/services/person/person-service';
import { DetallePersona } from '../detalle-persona/detalle-persona';
import { PersonInvitation } from '../person-invitation/person-invitation';
import { AuthService } from '../../../core/services/auth/auth';
import {
  AuthPersona,
} from '../../../core/services/authPersona/auth-persona';

import {
  AuthSessionContext,
} from '../../../core/Auth/auth-session-context';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, PersonInvitation, FormsModule, DetallePersona],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.css',
})
export class PersonsComponent implements OnInit {
  people: PersonResponse[] = [];

  isLoading = false;
  hasErrors = false;
  errorMessage = '';
  showInvitationForm = false;
  searchTerm = '';
  itemsPerPage = 10;
  currentPage = 1;
  selectedPersonType = 'all';
  selectedStatus = 'all';
  selectedPerson: PersonResponse | null = null;
  showPersonDetail = false;
  isAdmin = false;
  isSecurity = false;

  constructor(
    private readonly personService: PersonService,
    private readonly authService: AuthService,
    private readonly authPersona: AuthPersona,
    private readonly sessionContext: AuthSessionContext,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserPermissions();
  }

  private loadUserPermissions(): void {
    this.isAdmin = false;
    this.isSecurity = false;

    const identityType =
      this.sessionContext
        .getIdentityType();

    if (identityType === 'persona') {
      this.validarSesionPersona();
      return;
    }

    if (identityType === 'admin') {
      this.validarSesionAdmin();
      return;
    }

    this.validarSesionDesconocida();
  }

  private validarSesionPersona(): void {
    this.authPersona
      .comprobarSesion()
      .subscribe({
        next: (session) => {
          this.isAdmin = false;

          this.isSecurity =
            session.tipo === 'Seguridad';

          this.sessionContext
            .setPersona();

          this.loadPeople();
        },

        error: () => {
          this.sessionContext.clear();
          this.mostrarErrorPermisos();
        },
      });
  }

  private validarSesionAdmin(): void {
    this.authService
      .obtenerPerfil()
      .subscribe({
        next: () => {
          this.isAdmin = true;
          this.isSecurity = false;

          this.sessionContext
            .setAdmin();

          this.loadPeople();
        },

        error: () => {
          this.sessionContext.clear();
          this.mostrarErrorPermisos();
        },
      });
  }

  private validarSesionDesconocida(): void {
    this.authPersona
      .comprobarSesion()
      .subscribe({
        next: (session) => {
          this.isAdmin = false;

          this.isSecurity =
            session.tipo === 'Seguridad';

          this.sessionContext
            .setPersona();

          this.loadPeople();
        },

        error: () => {
          this.authService
            .obtenerPerfil()
            .subscribe({
              next: () => {
                this.isAdmin = true;
                this.isSecurity = false;

                this.sessionContext
                  .setAdmin();

                this.loadPeople();
              },

              error: () => {
                this.mostrarErrorPermisos();
              },
            });
        },
      });
  }

  private mostrarErrorPermisos(): void {
    this.isAdmin = false;
    this.isSecurity = false;

    this.people = [];

    this.hasErrors = true;

    this.errorMessage =
      'No tienes permisos para consultar la lista de personas.';

    this.cdr.detectChanges();
  }

  loadPeople(): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.hasErrors = false;
    this.errorMessage = '';

    const request$ = this.isAdmin
      ? this.personService.getPeople()
      : this.isSecurity
        ? this.personService.getSecurityVisiblePeople()
        : null;

    if (!request$) {
      this.isLoading = false;
      this.hasErrors = true;

      this.errorMessage =
        'No tienes permisos para consultar la lista de personas.';

      this.cdr.detectChanges();

      return;
    }

    request$
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (people: PersonResponse[]) => {
          this.people =
            Array.isArray(people)
              ? people
              : [];

          this.hasErrors = false;
          this.errorMessage = '';

          this.resetPagination();
        },

        error: (error) => {
          console.error(
            'Error cargando personas:',
            error
          );

          this.people = [];
          this.hasErrors = true;

          this.errorMessage =
            error?.error?.message ??
            error?.error?.mensaje ??
            error?.message ??
            'No se pudieron cargar las personas.';
        },
      });
  }

  openPersonDetail(person: PersonResponse): void {
    this.selectedPerson = person;
    this.showPersonDetail = true;
  }

  closePersonDetail(): void {
    this.selectedPerson = null;
    this.showPersonDetail = false;
  }

  togglePersonStatus(personId: string): void {
    if (!this.isAdmin) {
      this.hasErrors = true;

      this.errorMessage =
        'Solo un administrador puede cambiar el estado de una persona.';

      return;
    }

    if (!personId) {
      return;
    }

    this.hasErrors = false;
    this.errorMessage = '';

    this.personService
      .togglePersonStatus(personId)
      .subscribe({
        next: () => {
          this.loadPeople();
        },

        error: (error) => {
          console.error(
            'Error cambiando el estado de la persona:',
            error
          );

          this.hasErrors = true;

          this.errorMessage =
            error?.error?.message ??
            error?.error?.mensaje ??
            error?.message ??
            'No se pudo cambiar el estado de la persona.';
        },
      });
  }

  get activePeopleCount(): number {
    return this.people.filter(
      (person) => person.active && !person.permanentlyDeactivated
    ).length;
  }

  get inactivePeopleCount(): number {
    return this.people.filter(
      (person) => !person.active && !person.permanentlyDeactivated
    ).length;
  }

  get attentionPeopleCount(): number {
    return this.people.filter(
      (person) => person.permanentlyDeactivated
    ).length;
  }

  get filteredPeople(): PersonResponse[] {
    const term = this.normalizeText(this.searchTerm);

    return this.people.filter((person) => {
      const matchesSearch =
        !term ||
        this.normalizeText(`
          ${person.name}
          ${person.document}
          ${person.tower}
          ${person.apartment}
        `).includes(term);

      const matchesType =
        this.selectedPersonType === 'all' ||
        person.personType === Number(this.selectedPersonType);

      const matchesStatus =
        this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' &&
          person.active &&
          !person.permanentlyDeactivated) ||
        (this.selectedStatus === 'inactive' &&
          !person.active &&
          !person.permanentlyDeactivated) ||
        (this.selectedStatus === 'blocked' &&
          person.permanentlyDeactivated);

      return matchesSearch && matchesType && matchesStatus;
    });
  }

  get autocompleteOptions(): PersonResponse[] {
    const term = this.normalizeText(this.searchTerm);

    if (!term || term.length < 2) {
      return [];
    }

    return this.people
      .filter((person) =>
        this.normalizeText(person.name).includes(term)
      )
      .slice(0, 5);
  }

  selectAutocomplete(person: PersonResponse): void {
    this.searchTerm = person.name;
    this.resetPagination();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.resetPagination();
  }

  getPersonTypeName(personType: number): string {
    switch (personType) {
      case 1:
        return 'Residente';

      case 2:
        return 'Seguridad';

      case 3:
        return 'Personal';

      default:
        return 'Desconocido';
    }
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  get totalFilteredPeople(): number {
    return this.filteredPeople.length;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalFilteredPeople / this.itemsPerPage));
  }

  get paginatedPeople(): PersonResponse[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPeople.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get pageStart(): number {
    if (this.totalFilteredPeople === 0) {
      return 0;
    }

    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalFilteredPeople);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  resetPagination(): void {
    this.currentPage = 1;
  }
}