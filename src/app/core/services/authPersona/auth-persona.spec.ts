import { TestBed } from '@angular/core/testing';

import { AuthPersona } from './auth-persona';

describe('AuthPersona', () => {
  let service: AuthPersona;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthPersona);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
