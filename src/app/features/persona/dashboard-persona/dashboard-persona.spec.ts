import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPersona } from './dashboard-persona';

describe('DashboardPersona', () => {
  let component: DashboardPersona;
  let fixture: ComponentFixture<DashboardPersona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPersona]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardPersona);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
