import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserStateService } from '../../core/services/user-state.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  userState = inject(UserStateService);
  private router = inject(Router);

  ngOnInit(): void {
    if (!this.userState.currentUser()) {
      this.router.navigate(['/auth/login']);
    }
  }

  get user() { return this.userState.currentUser(); }
  get initial(): string { return (this.user?.name || 'U').charAt(0).toUpperCase(); }

  logout(): void {
    this.userState.logout();
    this.router.navigate(['/auth/login']);
  }
}
