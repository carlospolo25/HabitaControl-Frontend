import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormZonaComunes } from './form-zona-comunes';

describe('FormZonaComunes', () => {
  let component: FormZonaComunes;
  let fixture: ComponentFixture<FormZonaComunes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormZonaComunes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormZonaComunes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
