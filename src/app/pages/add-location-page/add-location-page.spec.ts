import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLocationPage } from './add-location-page';

describe('AddLocationPage', () => {
  let component: AddLocationPage;
  let fixture: ComponentFixture<AddLocationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLocationPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddLocationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
