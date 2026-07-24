import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EscanearInvitacionVisitante } from './escanear-invitacion-visitante';

describe('EscanearInvitacionVisitante', () => {
  let component: EscanearInvitacionVisitante;
  let fixture: ComponentFixture<EscanearInvitacionVisitante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EscanearInvitacionVisitante]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EscanearInvitacionVisitante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
