import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericTableComponent } from './generic-table.component';
import { COMMON_TEST_IMPORTS } from '../../testing/common-test-imports';

describe('GenericTableComponent', () => {
  let component: GenericTableComponent;
  let fixture: ComponentFixture<GenericTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // GenericTableComponent is standalone, so it belongs in imports rather than declarations —
      // COMMON_TEST_IMPORTS already brings it in.
      imports: [...COMMON_TEST_IMPORTS],
    });
    fixture = TestBed.createComponent(GenericTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
