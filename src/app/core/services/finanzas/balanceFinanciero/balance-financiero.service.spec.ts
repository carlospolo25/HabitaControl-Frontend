import { TestBed } from '@angular/core/testing';

import { BalanceFinancieroService } from './balance-financiero.service';

describe('BalanceFinancieroService', () => {
  let service: BalanceFinancieroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BalanceFinancieroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
