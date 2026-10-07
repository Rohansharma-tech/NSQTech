import { HttpInterceptorFn, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { UserStateService } from '../services/user-state.service';
import { LoadingService } from '../services/loading.service';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const router = inject(Router);
  const userState = inject(UserStateService);
  const loadingService = inject(LoadingService);

  loadingService.start();

  return next(req).pipe(
    tap({
      next: () => loadingService.stop(),
      error: (err: HttpErrorResponse) => {
        loadingService.stop();
        if (err.status === 401) {
          // Token expired or invalid — auto-logout
          userState.logout();
          router.navigate(['/auth/login'], { queryParams: { reason: 'session_expired' } });
        }
      },
    })
  );
};
