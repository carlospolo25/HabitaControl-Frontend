import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteFinanciero } from './reporte-financiero';

describe('ReporteFinanciero', () => {
  let component: ReporteFinanciero;
  let fixture: ComponentFixture<ReporteFinanciero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteFinanciero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteFinanciero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
