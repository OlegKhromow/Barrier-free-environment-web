import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingLocationInfoComponent } from './pending-location-info.component';

describe('PendingLocationInfoComponent', () => {
  let component: PendingLocationInfoComponent;
  let fixture: ComponentFixture<PendingLocationInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingLocationInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingLocationInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
