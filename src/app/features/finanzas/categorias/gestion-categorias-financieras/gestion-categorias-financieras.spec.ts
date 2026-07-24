import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionCategoriasFinancieras } from './gestion-categorias-financieras';

describe('GestionCategoriasFinancieras', () => {
  let component: GestionCategoriasFinancieras;
  let fixture: ComponentFixture<GestionCategoriasFinancieras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionCategoriasFinancieras]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionCategoriasFinancieras);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
