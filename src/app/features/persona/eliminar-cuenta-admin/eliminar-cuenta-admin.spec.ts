import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarCuentaAdmin } from './eliminar-cuenta-admin';

describe('EliminarCuentaAdmin', () => {
  let component: EliminarCuentaAdmin;
  let fixture: ComponentFixture<EliminarCuentaAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarCuentaAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarCuentaAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
