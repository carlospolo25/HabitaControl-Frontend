import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarCuentaPersona } from './eliminar-cuenta-persona';

describe('EliminarCuentaPersona', () => {
  let component: EliminarCuentaPersona;
  let fixture: ComponentFixture<EliminarCuentaPersona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarCuentaPersona]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarCuentaPersona);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
