import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionNormasConvivenciaComponent } from './gestion-normas-convivencia-component';

describe('GestionNormasConvivenciaComponent', () => {
  let component: GestionNormasConvivenciaComponent;
  let fixture: ComponentFixture<GestionNormasConvivenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionNormasConvivenciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionNormasConvivenciaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
