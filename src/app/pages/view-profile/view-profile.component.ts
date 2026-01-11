import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { SocialCard } from '../../shared/social-card/social-card';
import { ApiHelperService } from '../../shared/api-helper.service';
import { UserIdentityService } from '../../shared/user-identity.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './view-profile.component.html',
  styleUrls: ['./view-profile.component.scss']
})

export class ViewProfileComponent {
  userId: string | null = null;
  profile: any = null;
  userPosts: any[] = [];
  hasMorePosts = false;
  private page = 1;
  private pageSize = 30;

  constructor(
    private route: ActivatedRoute,
    private api: ApiHelperService,
    private userIdentity: UserIdentityService,
    private toast: ToastService
  ) {
    this.route.paramMap.subscribe(params => {
      const newUserId = params.get('userId');
      if (this.userId !== newUserId) {
        this.userId = newUserId;
        this.page = 1;
        this.fetchProfile();
        this.fetchUserPosts(true);
      }
    });
  }
  canDeletePost(post: any): boolean {
    const currentUserId = this.userIdentity.getUserId();
    return post.author?.id && currentUserId && post.author.id === currentUserId;
  }

  onDelete(post: any) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    this.api.delete(`/posts/posts/${post.id}/`).subscribe({
      next: () => {
        this.toast.show('Post deleted!', 'success');
        this.fetchUserPosts(true);
      },
      error: () => {
        this.toast.show('Failed to delete post', 'error');
      }
    });
  }

  fetchProfile() {
    if (!this.userId) return;
    this.api.get(`/accounts/users/${this.userId}/`).subscribe({
      next: (profile: any) => {
        this.profile = profile;
      },
      error: () => {
        this.profile = null;
      }
    });
  }

  fetchUserPosts(reset: boolean = false) {
    if (!this.userId) return;
    const params: any = {
      page: this.page,
      page_size: this.pageSize,
      authorId: this.userId
    };
    this.api.get<any>('/posts/posts/', { params }).subscribe({
      next: (data: any) => {
        const newPosts = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        if (reset) {
          this.userPosts = newPosts;
        } else {
          this.userPosts = [...this.userPosts, ...newPosts];
        }
        this.hasMorePosts = (data?.count || newPosts.length) > this.userPosts.length;
      },
      error: () => {
        if (reset) this.userPosts = [];
      }
    });
  }

  loadMorePosts() {
    this.page++;
    this.fetchUserPosts();
  }
}
