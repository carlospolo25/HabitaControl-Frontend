import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NovedadAsignar } from './novedad-asignar';

describe('NovedadAsignar', () => {
  let component: NovedadAsignar;
  let fixture: ComponentFixture<NovedadAsignar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NovedadAsignar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NovedadAsignar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
