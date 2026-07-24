import { TestBed } from '@angular/core/testing';

import { ReservazonaComun } from './reservazona-comun';

describe('ReservazonaComun', () => {
  let service: ReservazonaComun;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReservazonaComun);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
