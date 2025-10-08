import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriteriaEvaluationComponent } from './criteria-evaluation.component';

describe('CriteriaEvaluationComponent', () => {
  let component: CriteriaEvaluationComponent;
  let fixture: ComponentFixture<CriteriaEvaluationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriteriaEvaluationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CriteriaEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
