import { TestBed } from '@angular/core/testing';

import { NormaConvivencia } from './norma-convivencia';

describe('NormaConvivencia', () => {
  let service: NormaConvivencia;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NormaConvivencia);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
