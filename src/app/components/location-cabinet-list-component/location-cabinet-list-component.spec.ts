import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationCabinetListComponent } from './location-cabinet-list-component';

describe('LocationCabinetListComponent', () => {
  let component: LocationCabinetListComponent;
  let fixture: ComponentFixture<LocationCabinetListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationCabinetListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationCabinetListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
