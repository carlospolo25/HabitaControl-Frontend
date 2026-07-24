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
    const token = localStorage.getItem('accessToken');

    if (!token) {
      this.isAdmin = false;
      this.isSecurity = false;
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const role =
        payload.Role ||
        payload.role ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      const personType =
        payload.PersonType ||
        payload.personType ||
        payload.Tipo ||
        payload.tipo;

      this.isAdmin = role === 'Admin';
      this.isSecurity = personType === 'Seguridad' || role === 'Seguridad';

      console.log('===== PERSONS PERMISSIONS =====');
      console.log('PAYLOAD:', payload);
      console.log('ROLE:', role);
      console.log('PERSON TYPE:', personType);
      console.log('isAdmin:', this.isAdmin);
      console.log('isSecurity:', this.isSecurity);
    } catch (error) {
      console.error('Error leyendo permisos de persona:', error);
      this.isAdmin = false;
      this.isSecurity = false;
    }
  }

  loadPeople(): void {
    this.isLoading = true;
    this.hasErrors = false;
    this.errorMessage = '';

    this.personService
      .getPeople()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (people) => {
          this.people = people;
        },
        error: ({ error }) => {
          this.hasErrors = true;
          this.errorMessage =
            error?.message ?? 'No se pudieron cargar las personas.';
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
    this.hasErrors = false;
    this.errorMessage = '';

    this.personService.togglePersonStatus(personId).subscribe({
      next: () => this.loadPeople(),
      error: ({ error }) => {
        this.hasErrors = true;
        this.errorMessage =
          error?.message ?? 'No se pudo cambiar el estado de la persona.';
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