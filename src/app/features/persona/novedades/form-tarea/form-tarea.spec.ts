import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTarea } from './form-tarea';

describe('FormTarea', () => {
  let component: FormTarea;
  let fixture: ComponentFixture<FormTarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTarea]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormTarea);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
