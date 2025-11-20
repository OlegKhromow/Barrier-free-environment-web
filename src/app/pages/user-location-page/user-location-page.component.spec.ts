import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLocationPageComponent } from './user-location-page.component';

describe('UserLocationPageComponent', () => {
  let component: UserLocationPageComponent;
  let fixture: ComponentFixture<UserLocationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserLocationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserLocationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
