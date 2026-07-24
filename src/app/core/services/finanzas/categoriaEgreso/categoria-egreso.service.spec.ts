import { TestBed } from '@angular/core/testing';

import { CategoriaEgresoService } from './categoria-egreso.service';

describe('CategoriaEgresoService', () => {
  let service: CategoriaEgresoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoriaEgresoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
