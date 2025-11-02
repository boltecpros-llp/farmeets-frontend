import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiHelperService } from '../api-helper.service';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarouselModule } from 'ngx-bootstrap/carousel';

@Component({
  selector: 'app-blog-details',
  imports: [CommonModule, DatePipe, CarouselModule, FormsModule],
  templateUrl: './blog-details.html',
  styleUrl: './blog-details.scss',
})
export class BlogDetails implements OnInit {
  public facebookShareUrl = '';
  public linkedinShareUrl = '';
  public whatsappShareUrl = '';
  public xShareUrl = '';
  public likeDislike: boolean | null = null;
  public likeCount: number = 0;
  public dislikeCount: number = 0;

  public comments: any[] = [];
  public newComment: string = '';
  public isSubmittingComment = false;
  public commentsLoading = false;

  public currentUrl: string = '';
  public copySuccess = false;

  onLikeDislike(like: boolean) {
    let referenceId = this.pageData?.id || this.blogId;
    
    let newValue: boolean | null = like;
    if (this.likeDislike === like) {
      newValue = null;
    }
    this.api.post('/posts/like-dislikes/', {
      referenceId: referenceId,
      relatedTo: 'post',
      likeDislike: newValue
    }).subscribe(() => {
      // Update UI state
      if (this.likeDislike === true && newValue === null) this.likeCount = Math.max(0, this.likeCount - 1);
      if (this.likeDislike === false && newValue === null) this.dislikeCount = Math.max(0, this.dislikeCount - 1);
      if (this.likeDislike !== true && newValue === true) {
        this.likeCount++;
        if (this.likeDislike === false) this.dislikeCount = Math.max(0, this.dislikeCount - 1);
      }
      if (this.likeDislike !== false && newValue === false) {
        this.dislikeCount++;
        if (this.likeDislike === true) this.likeCount = Math.max(0, this.likeCount - 1);
      }
      this.likeDislike = newValue;
    });
  }
  private route = inject(ActivatedRoute);
  private api = inject(ApiHelperService);

  public pageData: any = null;
  public defaultConfig: any = {
    articleBodyClass: 'flex-grow-1',
    showArticleImage: true,
    articleImageClass: 'object-fit-cover',
    articleImageWrapperClass: 'card card-body ratio ratio-hero mb-3',
    articleHeaderClass: 'border-bottom pb-3 mb-3',
    articleHeadingClass: 'fs-2',
    articleSubHeadingClass: 'fs-4 fw-normal',
    articleIntroClass: 'border p-3 rounded my-3 bg-secondary text-white',
    articleContentClass: 'mb-5 border-bottom pb-5',
    showArticleIntro: true,
    showArticleMetaData: true,
    showReadingTime: true,
    publishDateWrapperClass: 'me-3',
    publishDateIconClass: 'bi bi-calendar',
    publishDateClass: 'ms-2',
    authorWrapperClass: 'me-3',
    authorIconClass: 'bi bi-user',
    authorClass: 'ms-2',
    readingTimeWrapperClass: 'me-3',
    readingTimeIconClass: 'bi-hourglass-split',
    readingTimeLabelClass: 'ms-1',
    readingTimeClass: 'ms-2',
    articleFooterLinkWrapperClass: 'd-flex justify-content-between card card-body flex-row mb-3',
    articleLikeDislikeClass: 'd-flex flex-row gap-2',
    articleLikeIconClass: 'bi bi-hand-thumbs-up me-1',
    articleLikeClass: 'text-dark fs-5',
    articleLikeLabelClass: 'fs-6 fw-light text-dark',
    articleDislikeIconClass: 'bi bi-hand-thumbs-down me-1',
    articleDislikeClass: 'text-dark fs-5',
    articleDislikeLabelClass: 'fs-6 fw-light text-dark',
    showArticleLikes: true,
    socialShareLinks: true,
    showArticleReviews: true,
    reviewHeading: 'Review',
    reviewHeadingClass: 'border-bottom pb-2 mb-3',
    reviewWrapperClass: 'd-block',
  };
  public config: any = this.defaultConfig;
  public readingTime: number | null = null;
  public socialShareLinks: any[] = [];
  public reviewData: any = null;
  public quickSignOnData: any = null;
  public dataModel = 'blog';
  public blogId!: string;

  ngOnInit() {
    this.currentUrl = window.location.href;
    // Build share URLs
    const shareUrl = encodeURIComponent(this.pageData?.shareUrl || this.currentUrl);
    this.facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    this.linkedinShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}`;
    this.whatsappShareUrl = `https://wa.me/?text=${shareUrl}`;
    this.xShareUrl = `https://x.com/intent/tweet?url=${shareUrl}`;
    this.blogId = this.route.snapshot.paramMap.get('blogId') as string;
    if (this.blogId) {
      this.api.get(`/posts/posts/${this.blogId}/`).subscribe({
        next: (res: any) => {
          this.pageData = res;
          this.readingTime = this.calculateReadingTime(res?.body || res?.description || '');
          this.likeDislike = res?.userLikeDislike ?? null;
          this.likeCount = res?.likes_count ?? 0;
          this.dislikeCount = res?.dislikes_count ?? 0;
          this.fetchComments();
        },
        error: () => {
          // Fallback default data
          this.pageData = {
            heading: 'Sample Blog Title',
            subHeading: 'A fallback blog subheading',
            images: ['ui-founder-visa-argo-atlantic.jpg', 'ui-visa-application-argo-atlantic.jpg'],
            description: 'This is a default blog description shown when the blog could not be loaded.',
            // body: '<p>This is default blog content. The requested blog could not be loaded due to a network or server error.</p>',
            publishStartDate: new Date(),
            // user: { name: 'Default Author' },
            author: { firstName: 'Default', lastName: 'Author' },
            id: 0,
            likes_count: 100,
            dislikes_count: 50
          };
          this.readingTime = this.calculateReadingTime(this.pageData.body);
          this.likeDislike = null;
          this.likeCount = 100;
          this.dislikeCount = 50;
          this.comments = [];
        }
      });
    }
  }

  copyUrl() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.pageData?.shareUrl || this.currentUrl).then(() => {
        this.copySuccess = true;
        setTimeout(() => this.copySuccess = false, 2000);
      });
    }
  }

  fetchComments() {
    if (!this.pageData?.id && !this.blogId) return;
    this.commentsLoading = true;
    const postId = this.pageData?.id || this.blogId;
    this.api.get(`/posts/comments/?post=${postId}`).subscribe({
      next: (res: any) => {
        // If API returns an array or {results: []}
        this.comments = Array.isArray(res) ? res : (res.results || []);
        this.commentsLoading = false;
      },
      error: () => {
        this.comments = [];
        this.commentsLoading = false;
      }
    });
  }

  submitComment() {
    if (!this.newComment.trim() || this.isSubmittingComment) return;
    this.isSubmittingComment = true;
    const postId = this.pageData?.id || this.blogId;
    this.api.post('/posts/comments/', {
      post: postId,
      message: this.newComment.trim()
    }).subscribe({
      next: (res: any) => {
        this.newComment = '';
        this.isSubmittingComment = false;
        this.fetchComments();
      },
      error: () => {
        this.isSubmittingComment = false;
        // Optionally show error toast
      }
    });
  }

  calculateReadingTime(text: string): number {
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }
}
