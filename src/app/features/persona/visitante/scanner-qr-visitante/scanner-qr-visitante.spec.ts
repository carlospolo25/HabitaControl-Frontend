import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScannerQrVisitante } from './scanner-qr-visitante';

describe('ScannerQrVisitante', () => {
  let component: ScannerQrVisitante;
  let fixture: ComponentFixture<ScannerQrVisitante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerQrVisitante]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScannerQrVisitante);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
