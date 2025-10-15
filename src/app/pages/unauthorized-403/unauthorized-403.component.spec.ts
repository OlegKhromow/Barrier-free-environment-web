import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Unauthorized403Component } from './unauthorized-403.component';

describe('Unauthorized403Component', () => {
  let component: Unauthorized403Component;
  let fixture: ComponentFixture<Unauthorized403Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Unauthorized403Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Unauthorized403Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
