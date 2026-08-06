import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { PersonResponse, PersonService} from '../../../core/services/person/person-service';
import { DetallePersona } from '../detalle-persona/detalle-persona';
import { PersonInvitation } from '../person-invitation/person-invitation';

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
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserPermissions();
    this.loadPeople();
  }

  private loadUserPermissions(): void {
    const adminToken =
      localStorage.getItem('accessToken');

    const personaToken =
      localStorage.getItem('personaAccessToken');

    const token =
      personaToken ?? adminToken;

    this.isAdmin = false;
    this.isSecurity = false;

    if (!token) {
      console.warn(
        'No existe un token disponible para consultar personas.'
      );

      return;
    }

    try {
      const partes = token.split('.');

      if (partes.length !== 3) {
        throw new Error('El token no tiene un formato válido.');
      }

      const payloadBase64 = partes[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const payloadConPadding =
        payloadBase64.padEnd(
          payloadBase64.length +
            ((4 - payloadBase64.length % 4) % 4),
          '='
        );

      const payload = JSON.parse(
        atob(payloadConPadding)
      );

      const role =
        payload.Role ??
        payload.role ??
        payload.Rol ??
        payload.rol ??
        payload[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
        ] ??
        '';

      const personType =
        payload.PersonType ??
        payload.personType ??
        payload.TipoPersona ??
        payload.tipoPersona ??
        payload.Tipo ??
        payload.tipo ??
        '';

      const roleNormalizado =
        String(role)
          .trim()
          .toLowerCase();

      const tipoNormalizado =
        String(personType)
          .trim()
          .toLowerCase();

      this.isAdmin =
        roleNormalizado === 'admin';

      this.isSecurity =
        tipoNormalizado === 'seguridad' ||
        tipoNormalizado === '2' ||
        roleNormalizado === 'seguridad';

      console.log(
        '===== PERSONS PERMISSIONS ====='
      );

      console.log('TOKEN UTILIZADO:', {
        esPersona: !!personaToken,
        esAdmin: !personaToken && !!adminToken,
      });

      console.log('PAYLOAD:', payload);
      console.log('ROLE:', role);
      console.log('PERSON TYPE:', personType);
      console.log('isAdmin:', this.isAdmin);
      console.log('isSecurity:', this.isSecurity);
    } catch (error) {
      console.error(
        'Error leyendo permisos de personas:',
        error
      );

      this.isAdmin = false;
      this.isSecurity = false;
    }
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