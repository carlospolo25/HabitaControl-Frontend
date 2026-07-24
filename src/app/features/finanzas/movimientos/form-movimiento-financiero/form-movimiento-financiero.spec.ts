import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormMovimientoFinanciero } from './form-movimiento-financiero';

describe('FormMovimientoFinanciero', () => {
  let component: FormMovimientoFinanciero;
  let fixture: ComponentFixture<FormMovimientoFinanciero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormMovimientoFinanciero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormMovimientoFinanciero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
