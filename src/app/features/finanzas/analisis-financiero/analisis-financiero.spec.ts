import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalisisFinanciero } from './analisis-financiero';

describe('AnalisisFinanciero', () => {
  let component: AnalisisFinanciero;
  let fixture: ComponentFixture<AnalisisFinanciero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalisisFinanciero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalisisFinanciero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
