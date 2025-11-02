import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabinetSideMenu } from './cabinet-side-menu';

describe('CabinetSideMenu', () => {
  let component: CabinetSideMenu;
  let fixture: ComponentFixture<CabinetSideMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabinetSideMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CabinetSideMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
