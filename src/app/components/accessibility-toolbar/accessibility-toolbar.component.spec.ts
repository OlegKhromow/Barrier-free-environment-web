import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccessibilityToolbarComponent } from './accessibility-toolbar.component';

describe('AccessibilityToolbarComponent', () => {
  let component: AccessibilityToolbarComponent;
  let fixture: ComponentFixture<AccessibilityToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessibilityToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccessibilityToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
