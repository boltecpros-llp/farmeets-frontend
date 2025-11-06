import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Sidebar } from "../../shared/sidebar/sidebar";

import { Router } from '@angular/router';
import { ApiHelperService } from '../../shared/api-helper.service';
import { UserIdentityService } from '../../shared/user-identity.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterOutlet, RouterModule, NgbPaginationModule, Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})

export class Dashboard {
  selectedGroup: any = null;
  myGroups: any[] = [];
  exploreGroups: any[] = [];

  constructor(private router: Router, private api: ApiHelperService, private userIdentity: UserIdentityService) {}

  // Returns the user's group object if present, else null
  get myGroupObj() {
    if (!this.selectedGroup?.id) return null;
    return this.myGroups.find(g => g.group.id === this.selectedGroup.id) || null;
  }

  // True if user is approved member
  get isMyGroupApproved(): boolean {
    return !!(this.myGroupObj && this.myGroupObj.status === 'Approved');
  }

  // True if user has requested but not yet approved
  get isGroupPending(): boolean {
    return !!(this.myGroupObj && this.myGroupObj.status === 'Pending');
  }

  // True if user has requested to join (pending or approved)
  get isGroupRequested(): boolean {
    return !!this.myGroupObj;
  }

  onGroupSelected(event: any) {
    this.selectedGroup = event.group;
    this.myGroups = event.myGroups;
    this.exploreGroups = event.exploreGroups;
  }

  onCreatePost() {
    if (this.selectedGroup?.id && this.selectedGroup.id !== 'general') {
      this.router.navigate(['/dashboard', this.selectedGroup.id, 'create-post']);
    } else {
      // For general group, do not use category/group id
      this.router.navigate(['/dashboard', 'general', 'create-post']);
    }
  }

  onJoinGroup() {
    if (!this.selectedGroup?.id) return;
    const groupId = this.selectedGroup.id;
    const userId = this.userIdentity.getUserId();
    this.api.post('/posts/groups/subscribe/', { group_id: groupId }).subscribe({
      next: () => {
        this.api.get<any[]>(`accounts/user-groups/?user_id=${userId}`).subscribe({
          next: (data: any) => {
            this.myGroups = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
          },
          error: () => {
            this.myGroups = [];
          }
        });
      }
    });
  }
}
