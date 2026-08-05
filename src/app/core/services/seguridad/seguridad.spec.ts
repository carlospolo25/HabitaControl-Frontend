import { TestBed } from '@angular/core/testing';

import { Seguridad } from './seguridad';

describe('Seguridad', () => {
  let service: Seguridad;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Seguridad);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
