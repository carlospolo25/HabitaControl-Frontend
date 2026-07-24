import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallePersona } from './detalle-persona';

describe('DetallePersona', () => {
  let component: DetallePersona;
  let fixture: ComponentFixture<DetallePersona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePersona]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallePersona);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
