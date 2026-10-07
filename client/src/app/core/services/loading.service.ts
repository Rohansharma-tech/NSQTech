import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _activeRequests = 0;
  readonly isLoading = signal(false);

  start(): void {
    this._activeRequests++;
    this.isLoading.set(true);
  }

  stop(): void {
    this._activeRequests = Math.max(0, this._activeRequests - 1);
    if (this._activeRequests === 0) {
      this.isLoading.set(false);
    }
  }
}
