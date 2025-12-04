import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterOverlay } from './register-overlay';

describe('RegisterOverlay', () => {
  let component: RegisterOverlay;
  let fixture: ComponentFixture<RegisterOverlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterOverlay]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterOverlay);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
