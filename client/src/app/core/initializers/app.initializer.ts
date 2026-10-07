import { APP_INITIALIZER, Provider } from '@angular/core';
import { UserStateService } from '../services/user-state.service';
import { AuthApiService } from '../services/auth-api.service';

function initializeApp(
  userState: UserStateService,
  authApi: AuthApiService
): () => Promise<void> {
  return () =>
    new Promise<void>((resolve) => {
      const session = userState.restoreSession();
      if (!session) {
        resolve();
        return;
      }

      // Validate token is still valid with the server
      authApi.getMe().subscribe({
        next: (user) => {
          userState.setUser(user);
          resolve();
        },
        error: () => {
          // Token invalid/expired — clear session
          userState.logout();
          resolve();
        },
      });
    });
}

export const appInitializerProvider: Provider = {
  provide: APP_INITIALIZER,
  useFactory: initializeApp,
  deps: [UserStateService, AuthApiService],
  multi: true,
};
