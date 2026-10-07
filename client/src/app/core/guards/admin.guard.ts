import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserStateService } from '../services/user-state.service';

export const adminGuard: CanActivateFn = () => {
  const userState = inject(UserStateService);
  const router = inject(Router);

  if (userState.isAdmin()) {
    return true;
  }

  // Logged in but not admin → redirect to dashboard (not login)
  return router.createUrlTree(['/dashboard']);
};
