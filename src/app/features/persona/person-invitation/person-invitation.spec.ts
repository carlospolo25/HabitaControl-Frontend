import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonInvitation } from './person-invitation';

describe('PersonInvitation', () => {
  let component: PersonInvitation;
  let fixture: ComponentFixture<PersonInvitation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonInvitation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonInvitation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
