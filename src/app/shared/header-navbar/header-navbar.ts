
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserIdentityService } from '../user-identity.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-header-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule],
  templateUrl: './header-navbar.html',
  styleUrl: './header-navbar.scss',
})
export class HeaderNavbar {
  constructor(public userIdentity: UserIdentityService, public router: Router) {}

  get isDashboardRoute(): boolean {
    return this.router.url == '/';
  }

  logout() {
    this.userIdentity.logout();
  }
}
