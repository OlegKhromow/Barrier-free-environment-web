import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Unauthorized401Component } from './unauthorized-401.component';

describe('Unauthorized401Component', () => {
  let component: Unauthorized401Component;
  let fixture: ComponentFixture<Unauthorized401Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Unauthorized401Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Unauthorized401Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
