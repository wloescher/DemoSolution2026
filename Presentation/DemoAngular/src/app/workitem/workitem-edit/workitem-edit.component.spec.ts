import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkItemEditComponent } from './workitem-edit.component';
import { COMMON_TEST_IMPORTS } from '../../../testing/common-test-imports';

describe('WorkItemEditComponent', () => {
  let component: WorkItemEditComponent;
  let fixture: ComponentFixture<WorkItemEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      declarations: [WorkItemEditComponent]
    });
    fixture = TestBed.createComponent(WorkItemEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
