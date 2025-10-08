import { TestBed } from '@angular/core/testing';

import { BarrierlessCriteriaCheckService } from './barrierless-criteria-check.service';

describe('BarrierlessCriteriaCheckService', () => {
  let service: BarrierlessCriteriaCheckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BarrierlessCriteriaCheckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
