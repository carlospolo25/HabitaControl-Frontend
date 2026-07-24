import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaMovimientosFinancieros } from './lista-movimientos-financieros';

describe('ListaMovimientosFinancieros', () => {
  let component: ListaMovimientosFinancieros;
  let fixture: ComponentFixture<ListaMovimientosFinancieros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaMovimientosFinancieros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaMovimientosFinancieros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
