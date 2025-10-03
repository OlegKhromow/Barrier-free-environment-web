import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationCreateFormComponent } from './location-create-form.component';

describe('LocationCreateFormComponent', () => {
  let component: LocationCreateFormComponent;
  let fixture: ComponentFixture<LocationCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
