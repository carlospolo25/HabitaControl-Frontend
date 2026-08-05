import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilPersonas } from './perfil-personas';

describe('PerfilPersonas', () => {
  let component: PerfilPersonas;
  let fixture: ComponentFixture<PerfilPersonas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilPersonas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilPersonas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
