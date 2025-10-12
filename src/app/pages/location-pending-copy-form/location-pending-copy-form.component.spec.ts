import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationPendingCopyFormComponent } from './location-pending-copy-form.component';

describe('LocationPendingCopyFormComponent', () => {
  let component: LocationPendingCopyFormComponent;
  let fixture: ComponentFixture<LocationPendingCopyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationPendingCopyFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationPendingCopyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
