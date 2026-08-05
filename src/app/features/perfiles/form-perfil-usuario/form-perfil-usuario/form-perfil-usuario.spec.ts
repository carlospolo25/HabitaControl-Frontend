import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormPerfilUsuario } from './form-perfil-usuario';

describe('FormPerfilUsuario', () => {
  let component: FormPerfilUsuario;
  let fixture: ComponentFixture<FormPerfilUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPerfilUsuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormPerfilUsuario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
