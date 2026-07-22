import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of } from 'rxjs';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * Two defects once shipped in this guard, and the generated spec passed the whole time because it
 * only asserted that the guard function reference was truthy — it never invoked the guard:
 *
 *   1. It read `authService.isLoggedIn`, a getter returning an Observable. An Observable object is
 *      always truthy, so the allow branch always won.
 *   2. It returned `router.navigateByUrl('/login')`, whose Promise<boolean> resolves true on a
 *      successful redirect — which the router reads as "guard passed".
 *
 * Because of (2), asserting only "did it redirect?" is not enough: the broken guard *did* redirect
 * and still let the original navigation through. These tests assert on the guard's return value.
 */
describe('AuthGuard', () => {
  let authService: {
    isAuthenticated: jasmine.Spy<() => boolean>;
    readonly isLoggedIn: Observable<boolean>;
  };
  let isLoggedInGetter: jasmine.Spy;
  let router: Router;

  const runGuard = () =>
    TestBed.runInInjectionContext(() =>
      AuthGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/clients' } as RouterStateSnapshot
      )
    );

  beforeEach(() => {
    authService = {
      isAuthenticated: jasmine.createSpy<() => boolean>('isAuthenticated'),
      // Mirrors the real getter: an Observable, and therefore truthy even when logged out.
      get isLoggedIn() {
        return of(false);
      },
    };
    isLoggedInGetter = spyOnProperty(authService, 'isLoggedIn', 'get').and.returnValue(of(false));

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }],
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
  });

  it('allows the navigation when the user is authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);

    expect(runGuard()).toBeTrue();
  });

  it('redirects to /login when the user is not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('blocks by returning a UrlTree, not by navigating imperatively', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = runGuard();

    // Regression guard for defect (2): navigateByUrl() returns a Promise that resolves true,
    // which would let the original navigation proceed even though the redirect fired.
    expect(result).not.toBeTrue();
    expect(result instanceof Promise).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('reads the cookie-backed isAuthenticated(), not the always-truthy isLoggedIn observable', () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = runGuard();

    // Regression guard for defect (1). isLoggedIn is stubbed to an Observable of false, which is
    // still a truthy object — so a guard reading it would wrongly allow the navigation here.
    expect(authService.isAuthenticated).toHaveBeenCalledTimes(1);
    expect(isLoggedInGetter).not.toHaveBeenCalled();
    expect(result).not.toBeTrue();
  });
});
