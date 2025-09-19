import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationSidebarComponent } from './location-sidebar.component';

describe('LocationSidebar', () => {
  let component: LocationSidebarComponent;
  let fixture: ComponentFixture<LocationSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
