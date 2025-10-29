import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationsListPage } from './locations-list-page.component';

describe('LocationsListPageComponent', () => {
  let component: LocationsListPage;
  let fixture: ComponentFixture<LocationsListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationsListPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationsListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
