import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarRecuperacionContrasena } from './solicitar-recuperacion-contrasena';

describe('SolicitarRecuperacionContrasena', () => {
  let component: SolicitarRecuperacionContrasena;
  let fixture: ComponentFixture<SolicitarRecuperacionContrasena>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitarRecuperacionContrasena]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitarRecuperacionContrasena);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
