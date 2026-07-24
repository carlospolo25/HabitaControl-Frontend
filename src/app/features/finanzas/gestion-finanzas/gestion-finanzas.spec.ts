import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionFinanzas } from './gestion-finanzas';

describe('GestionFinanzas', () => {
  let component: GestionFinanzas;
  let fixture: ComponentFixture<GestionFinanzas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionFinanzas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionFinanzas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
