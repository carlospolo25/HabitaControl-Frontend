import { TestBed } from '@angular/core/testing';

import { Aviso } from './aviso';

describe('Aviso', () => {
  let service: Aviso;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Aviso);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
