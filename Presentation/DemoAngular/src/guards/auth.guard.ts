import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // isAuthenticated() reads the cookie synchronously, so it is correct on a deep link or a
  // full page reload — unlike the in-memory isLoggedIn subject, which starts out false.
  if (authService.isAuthenticated()) {
    return true;
  }

  // Return the UrlTree rather than calling navigateByUrl(): that returns a Promise<boolean>
  // resolving true on a successful redirect, which the router reads as "guard passed".
  return router.parseUrl('/login');
};
