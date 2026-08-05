import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPerfilPersona } from './form-perfil-persona';

describe('FormPerfilPersona', () => {
  let component: FormPerfilPersona;
  let fixture: ComponentFixture<FormPerfilPersona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPerfilPersona]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPerfilPersona);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
