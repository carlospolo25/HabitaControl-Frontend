import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAvisoComponent } from './form-aviso-component';

describe('FormAvisoComponent', () => {
  let component: FormAvisoComponent;
  let fixture: ComponentFixture<FormAvisoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAvisoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormAvisoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
