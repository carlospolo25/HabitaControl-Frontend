import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { finalize } from 'rxjs';
import { PersonResponse, PersonService  } from '../../../../core/services/person/person-service';
import { NovedadService, AsignarNovedadRequest } from '../../../../core/services/novedad/novedad';


@Component({
  selector: 'app-novedad-asignar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './novedad-asignar.html',
  styleUrl: './novedad-asignar.css',
})
export class NovedadAsignar implements OnInit {
  @Input() novedadId!: string;

  @Output() cancelar = new EventEmitter<void>();
  @Output() asignacionCompletada = new EventEmitter<void>();

  responsables: PersonResponse[] = [];

  personaId = '';

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private personService: PersonService,
    private novedadService: NovedadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.obtenerResponsables();
  }

  obtenerResponsables(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.personService.getPeople()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (people: PersonResponse[]) => {
          this.responsables = people.filter(person =>
            this.esResponsableValido(person)
          );
          this.cdr.detectChanges();
        },
        error: () => {
          this.errorMessage = 'No se pudieron cargar los responsables disponibles.';
          this.cdr.detectChanges();
        }
      });
  }

  esResponsableValido(person: PersonResponse): boolean {
    const tipo = person.personTypeName.toLowerCase().trim();

    return (
      person.active &&
      (tipo === 'seguridad' || tipo === 'personal')
    );
  }
  
  asignar(): void {
    if (!this.novedadId) {
      this.errorMessage = 'No se encontró la novedad seleccionada.';
      return;
    }

    if (!this.personaId) {
      this.errorMessage = 'Selecciona un responsable.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: AsignarNovedadRequest = {
      novedadId: this.novedadId,
      personaId: this.personaId,
    };

    this.novedadService.asignar(request)
    .pipe(finalize(() => {
      this.isSaving = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (response) => {
        this.successMessage =
          response?.message || 'Novedad asignada correctamente.';

        this.cdr.detectChanges();
        this.asignacionCompletada.emit();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          err?.error ||
          'No se pudo asignar la novedad.';

        this.cdr.detectChanges();
      }
    });
  }

  volver(): void {
    this.cancelar.emit();
  }
}