import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormEntregaPaquete } from './form-entrega-paquete';

describe('FormEntregaPaquete', () => {
  let component: FormEntregaPaquete;
  let fixture: ComponentFixture<FormEntregaPaquete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormEntregaPaquete]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormEntregaPaquete);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
