import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DuplicatesDialogComponent } from './duplicates-dialog.component';

describe('DuplicatesDialogComponent', () => {
  let component: DuplicatesDialogComponent;
  let fixture: ComponentFixture<DuplicatesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DuplicatesDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DuplicatesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
