import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionAvisos } from './gestion-avisos';

describe('GestionAvisos', () => {
  let component: GestionAvisos;
  let fixture: ComponentFixture<GestionAvisos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionAvisos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionAvisos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
