import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkItemListComponent } from './workitem-list.component';
import { COMMON_TEST_IMPORTS } from '../../../testing/common-test-imports';

describe('WorkItemListComponent', () => {
  let component: WorkItemListComponent;
  let fixture: ComponentFixture<WorkItemListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [WorkItemListComponent]
    });
    fixture = TestBed.createComponent(WorkItemListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
