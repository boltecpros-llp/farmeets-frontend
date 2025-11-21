import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApiHelperService } from '../api-helper.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  myGroups: any[] = [];
  exploreGroups: any[] = [];

  selectedGroup: any = null;

  // Used for conditional rendering of 'My Companies' menu
  isLoggedIn = false; // TODO: Replace with real authentication check

  @Output() groupSelected = new EventEmitter<any>();

  constructor(private api: ApiHelperService, private router: Router, private route: ActivatedRoute) { }
  onGroupClick(group: any) {
    this.selectedGroup = group == 'general' ? null : group;
    // Navigation now handled by [routerLink] in template; only emit event on click
    this.groupSelected.emit({ group: group?.group || group, myGroups: this.myGroups, exploreGroups: this.exploreGroups });
  }

  onCreatePost(group: any) {
    this.router.navigate(['/dashboard', group.id, 'create-post']);
  }

  ngOnInit() {
    const userId = this.getUserId();
    // Use parent route if params are defined there (e.g., in dashboard parent route)
    (this.route.firstChild ?? this.route).paramMap.subscribe(params => {
      const categoryId = params.get('categoryId');
      // this.fetchUserGroups(userId, categoryId);
      // this.fetchExploreGroups(categoryId);
    });
  }

  private getUserId(): string {
    let userId = '';
    try {
      userId = localStorage.getItem('userId') || '';
    } catch {
      userId = '';
    }
    return userId || '5f737021-5d18-4b14-85e4-4a1d094a4cd9';
  }

  private fetchUserGroups(userId: string, categoryId?: string | null) {
    this.api.get<any[]>(`accounts/user-groups/?user_id=${userId}`).subscribe({
      next: (data: any) => {
        this.myGroups = (Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []));
        if (categoryId) {
          const match = this.myGroups.find(g => g.group.id === categoryId);
          if (match) {
            this.groupSelected.emit({ group: match.group, myGroups: this.myGroups, exploreGroups: this.exploreGroups });
          }
        }
      },
      error: () => {
        this.myGroups = [];
      }
    });
  }

  private fetchExploreGroups(categoryId?: string | null) {
    this.api.get<any>('posts/categories/?limit=10').subscribe({
      next: (data: any) => {
        this.exploreGroups = Array.isArray(data)
          ? data.slice(0, 10)
          : Array.isArray(data?.results)
            ? data.results.slice(0, 10)
            : [];
        if (categoryId && !this.myGroups.find(g => g.id === categoryId)) {
          const match = this.exploreGroups.find(g => g.id === categoryId);
          if (match) {
            this.groupSelected.emit({ group: match, myGroups: this.myGroups, exploreGroups: this.exploreGroups });
          }
        }
      },
      error: () => {
        this.exploreGroups = [];
      }
    });
  }
}
