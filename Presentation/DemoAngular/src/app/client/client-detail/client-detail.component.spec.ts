import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDetailComponent } from './client-detail.component';
import { COMMON_TEST_IMPORTS } from '../../../testing/common-test-imports';
import { provideActivatedRouteStub } from '../../../testing/activated-route.stub';

describe('ClientDetailComponent', () => {
  let component: ClientDetailComponent;
  let fixture: ComponentFixture<ClientDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...COMMON_TEST_IMPORTS],
      // Client 1 exists in the service's inline test data; without an id the
      // component resolves `undefined` and the template throws on render.
      providers: [provideActivatedRouteStub({ id: '1' })],
      declarations: [ClientDetailComponent]
    });
    fixture = TestBed.createComponent(ClientDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
