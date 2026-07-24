import { TestBed } from '@angular/core/testing';

import { ReporteFinancieroPdfService } from './reporte-financiero-pdf.service';

describe('ReporteFinancieroPdfService', () => {
  let service: ReporteFinancieroPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteFinancieroPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
