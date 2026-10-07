import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="progress-bar-container" [class.visible]="loadingService.isLoading()">
      <div class="progress-bar"></div>
    </div>
    <router-outlet />
  `,
  styles: [`
    .progress-bar-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
    .progress-bar-container.visible {
      opacity: 1;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #60a5fa);
      animation: progress 1.5s ease-in-out infinite;
      border-radius: 0 2px 2px 0;
    }
    @keyframes progress {
      0% { width: 0%; margin-left: 0; }
      50% { width: 70%; margin-left: 0; }
      100% { width: 0%; margin-left: 100%; }
    }
  `],
})
export class AppComponent {
  loadingService = inject(LoadingService);
}
