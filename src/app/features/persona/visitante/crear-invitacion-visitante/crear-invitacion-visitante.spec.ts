import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearInvitacionVisitante } from './crear-invitacion-visitante';

describe('CrearInvitacionVisitante', () => {
  let component: CrearInvitacionVisitante;
  let fixture: ComponentFixture<CrearInvitacionVisitante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearInvitacionVisitante]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearInvitacionVisitante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
