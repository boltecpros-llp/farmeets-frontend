import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SocialCard } from '../../shared/social-card/social-card';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [CommonModule, SocialCard],
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

  constructor(private route: ActivatedRoute) {
    this.userId = this.route.snapshot.paramMap.get('userId');
  }

  ngOnInit() {
    // TODO: Replace with real API calls
    this.fetchProfile();
    this.fetchUserPosts();
  }

  fetchProfile() {
    // TODO: Replace with real API call
    this.profile = {
      id: this.userId,
      name: 'Sample User',
      profilePicture: '',
      bio: 'This is a sample bio.',
      email: 'user@email.com',
      mobile: '1234567890'
    };
  }

  fetchUserPosts() {
    // TODO: Replace with real API call
    // Simulate 35 posts for demo
    const totalPosts = 35;
    const allPosts = Array.from({length: totalPosts}, (_, i) => ({
      id: i+1,
      title: `Post ${i+1}`,
      description: `Description for post ${i+1}`,
      author: { id: this.userId, name: 'Sample User', profilePicture: '' },
      images: [],
      videos: [],
      created_at: new Date(),
    }));
    const start = (this.page-1)*this.pageSize;
    const end = start + this.pageSize;
    this.userPosts = [...this.userPosts, ...allPosts.slice(start, end)];
    this.hasMorePosts = end < totalPosts;
  }

  loadMorePosts() {
    this.page++;
    this.fetchUserPosts();
  }
}
