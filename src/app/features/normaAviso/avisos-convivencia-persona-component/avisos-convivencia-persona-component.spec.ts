import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvisosConvivenciaPersonaComponent } from './avisos-convivencia-persona-component';

describe('AvisosConvivenciaPersonaComponent', () => {
  let component: AvisosConvivenciaPersonaComponent;
  let fixture: ComponentFixture<AvisosConvivenciaPersonaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvisosConvivenciaPersonaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvisosConvivenciaPersonaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
