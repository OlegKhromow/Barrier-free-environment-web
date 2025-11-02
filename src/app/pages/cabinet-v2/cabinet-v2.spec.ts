import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabinetV2 } from './cabinet-v2';

describe('CabinetV2', () => {
  let component: CabinetV2;
  let fixture: ComponentFixture<CabinetV2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabinetV2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CabinetV2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
