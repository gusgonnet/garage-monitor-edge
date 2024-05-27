import { TestBed } from '@angular/core/testing';

import { FsmService } from './fsm.service';

describe('FsmService', () => {
  let service: FsmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FsmService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
