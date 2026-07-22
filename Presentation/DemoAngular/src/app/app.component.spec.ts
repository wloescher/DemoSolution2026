import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SiteHeaderComponent } from './site-header/site-header.component';
import { COMMON_TEST_IMPORTS } from '../testing/common-test-imports';

describe('AppComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [...COMMON_TEST_IMPORTS],
    // AppComponent's template is <demo-site-header> + <router-outlet>, so the header has to be
    // declared for the shell to render. RouterTestingModule supplies the outlet.
    declarations: [AppComponent, SiteHeaderComponent],
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'DemoAngular'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('DemoAngular');
  });

  it('should render the site header and the router outlet', () => {
    // Replaces the generated assertion for `.content span` containing
    // "DemoAngular app is running!" — that markup belonged to the starter template and has not
    // existed since app.component.html became the site-header + outlet shell, so the test could
    // never have passed.
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('demo-site-header')).not.toBeNull();
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
