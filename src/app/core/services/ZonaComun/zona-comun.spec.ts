import { TestBed } from '@angular/core/testing';

import { ZonaComun } from './zona-comun';

describe('ZonaComun', () => {
  let service: ZonaComun;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZonaComun);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
