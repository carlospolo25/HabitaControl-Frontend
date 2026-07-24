import { TestBed } from '@angular/core/testing';

import { RecuperacionContrasenaServiceTs } from './recuperacion-contrasena.service.ts';

describe('RecuperacionContrasenaServiceTs', () => {
  let service: RecuperacionContrasenaServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecuperacionContrasenaServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
