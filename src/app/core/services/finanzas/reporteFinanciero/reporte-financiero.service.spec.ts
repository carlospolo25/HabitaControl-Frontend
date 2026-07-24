import { TestBed } from '@angular/core/testing';

import { ReporteFinancieroService } from './reporte-financiero.service';

describe('ReporteFinancieroService', () => {
  let service: ReporteFinancieroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteFinancieroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
