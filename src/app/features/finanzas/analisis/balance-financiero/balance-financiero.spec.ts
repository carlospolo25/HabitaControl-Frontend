import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BalanceFinanciero } from './balance-financiero';

describe('BalanceFinanciero', () => {
  let component: BalanceFinanciero;
  let fixture: ComponentFixture<BalanceFinanciero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BalanceFinanciero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceFinanciero);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
