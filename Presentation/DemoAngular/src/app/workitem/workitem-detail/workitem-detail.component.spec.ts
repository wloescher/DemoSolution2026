import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkItemDetailComponent } from './workitem-detail.component';
import { COMMON_TEST_IMPORTS } from '../../../testing/common-test-imports';
import { provideActivatedRouteStub } from '../../../testing/activated-route.stub';

describe('WorkItemDetailComponent', () => {
  let component: WorkItemDetailComponent;
  let fixture: ComponentFixture<WorkItemDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      // Work Item 2 exists in the service's inline test data; without an id the
      // component resolves `undefined` and the template throws on render.
      providers: [provideActivatedRouteStub({ id: '2' })],
      declarations: [WorkItemDetailComponent]
    });
    fixture = TestBed.createComponent(WorkItemDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
