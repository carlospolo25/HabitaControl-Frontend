import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormNormaConvivencia } from './form-norma-convivencia';

describe('FormNormaConvivencia', () => {
  let component: FormNormaConvivencia;
  let fixture: ComponentFixture<FormNormaConvivencia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormNormaConvivencia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormNormaConvivencia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
