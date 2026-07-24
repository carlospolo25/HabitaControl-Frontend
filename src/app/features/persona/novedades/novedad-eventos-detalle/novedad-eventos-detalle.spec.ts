import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovedadEventosDetalle } from './novedad-eventos-detalle';

describe('NovedadEventosDetalle', () => {
  let component: NovedadEventosDetalle;
  let fixture: ComponentFixture<NovedadEventosDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovedadEventosDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovedadEventosDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
