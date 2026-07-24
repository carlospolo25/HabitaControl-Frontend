import { TestBed } from '@angular/core/testing';

import { Novedad } from './novedad';

describe('Novedad', () => {
  let service: Novedad;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Novedad);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
