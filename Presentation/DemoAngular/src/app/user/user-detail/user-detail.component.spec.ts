import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserDetailComponent } from './user-detail.component';
import { COMMON_TEST_IMPORTS } from '../../../testing/common-test-imports';
import { provideActivatedRouteStub } from '../../../testing/activated-route.stub';

describe('UserDetailComponent', () => {
  let component: UserDetailComponent;
  let fixture: ComponentFixture<UserDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      // User 3 exists in the service's inline test data; without an id the
      // component resolves `undefined` and the template throws on render.
      providers: [provideActivatedRouteStub({ id: '3' })],
      declarations: [UserDetailComponent]
    });
    fixture = TestBed.createComponent(UserDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
