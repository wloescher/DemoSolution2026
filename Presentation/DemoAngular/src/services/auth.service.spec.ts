import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { COMMON_TEST_IMPORTS } from '../testing/common-test-imports';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    // AuthService constructor-injects HttpClient (via HttpClientTestingModule) and CookieService.
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
