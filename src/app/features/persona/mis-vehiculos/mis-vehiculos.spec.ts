import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisVehiculos } from './mis-vehiculos';

describe('MisVehiculos', () => {
  let component: MisVehiculos;
  let fixture: ComponentFixture<MisVehiculos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisVehiculos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisVehiculos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
