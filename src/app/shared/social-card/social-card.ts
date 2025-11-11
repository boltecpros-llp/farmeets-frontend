import { Component, OnInit, Renderer2, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router, Params, RouterModule } from '@angular/router';
import { ApiHelperService } from '../api-helper.service';
import { combineLatest } from 'rxjs';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
    selector: 'app-social-card',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbPaginationModule, RouterModule, CarouselModule, NgbDropdownModule],
    templateUrl: './social-card.html'
})
export class SocialCard implements OnInit, AfterViewInit {
    facebookShareUrl = '';
    linkedinShareUrl = '';
    whatsappShareUrl = '';
    xShareUrl = '';
    copySuccess = false;
    setShareUrls(blog: any) {
        const shareUrl = encodeURIComponent(blog?.shareUrl || window.location.origin + '/posts/' + blog.id);
        this.facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        this.linkedinShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}`;
        this.whatsappShareUrl = `https://wa.me/?text=${shareUrl}`;
        this.xShareUrl = `https://x.com/intent/tweet?url=${shareUrl}`;
    }

    copyUrl(blog: any) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(blog?.shareUrl || window.location.origin + '/posts/' + blog.id).then(() => {
                this.copySuccess = true;
                setTimeout(() => this.copySuccess = false, 2000);
            });
        }
    }
    blogs: any[] = [];
    total = 0;
    page = 1;
    pageSize = 30;
    search = '';
    status: 'Active' | 'Inactive' | '' = 'Active';
    categoryId: string = '';
    postCards: NodeListOf<HTMLElement> = [] as any;
    currentIndex = 0;
    isScrolling = false;
    headerHeight = 76 + 8;
    likeDislikeMap: { [id: string]: boolean | null } = {};
    likeCountMap: { [id: string]: number } = {};
    dislikeCountMap: { [id: string]: number } = {};
    commentsMap: { [id: string]: any[] } = {};
    commentModalBlog: any = null;
    newComment: string = '';
    isSubmittingComment = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private api: ApiHelperService,
        private renderer: Renderer2,
        private el: ElementRef
    ) { }

    ngOnInit() {
        combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, qp]) => {
            this.categoryId = params.get('categoryId') || '';
            this.page = +(qp.get('page') || 1);
            this.pageSize = +(qp.get('page_size') || 30);
            this.search = qp.get('search') || '';
            this.status = (qp.get('status') as 'Active' | 'Inactive') || 'Active';
            this.fetchBlogs(true);
        });
    }

    ngAfterViewInit() {
        this.postCards = this.el.nativeElement.querySelectorAll('.post-card');
    }

    fetchBlogs(reset: boolean = false) {
        const params: any = {
            page: this.page,
            page_size: this.pageSize,
            status: this.status
        };
        if (this.categoryId && this.categoryId !== 'general') {
            params.category = this.categoryId;
        }
        if (this.search) params.search = this.search;
        this.api.get<any>('/posts/posts/', { params }).subscribe({
            next: (data: any) => {
                const newBlogs = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
                this.total = data?.count || newBlogs.length;
                if (reset) {
                    this.blogs = newBlogs;
                } else {
                    this.blogs = [...this.blogs, ...newBlogs];
                }
                setTimeout(() => {
                    this.postCards = this.el.nativeElement.querySelectorAll('.post-card');
                }, 100);
            },
            error: () => {
                if (reset) {
                    this.blogs = [];
                }
            }
        });
    }

    private scrollToPost(index: number) {
        if (this.postCards.length <= 0) {
            this.postCards = this.el.nativeElement.querySelectorAll('.post-card');
            if (this.postCards.length <= 0) return;
        }
        if (index < 0) index = 0;
        if (index >= this.postCards.length) index = this.postCards.length - 1;
        this.isScrolling = true;
        const postTop = this.postCards[index]?.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
            top: postTop - this.headerHeight,
            behavior: 'smooth'
        });
        this.currentIndex = index;
        setTimeout(() => (this.isScrolling = false), 700);
    }

    @HostListener('window:wheel', ['$event'])
    onWheel(e: WheelEvent) {
        if (this.isScrolling) return;
        if (e.deltaY > 0) this.scrollToPost(this.currentIndex + 1);
        else if (e.deltaY < 0) this.scrollToPost(this.currentIndex - 1);
    }

    touchStartY = 0;
    @HostListener('window:touchstart', ['$event'])
    onTouchStart(e: TouchEvent) {
        if (e.touches.length > 1) return;
        this.touchStartY = e.touches[0].clientY;
    }
    @HostListener('window:touchend', ['$event'])
    onTouchEnd(e: TouchEvent) {
        if (e.changedTouches.length > 1) return;
        const deltaY = this.touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(deltaY) > 20) {
            if (deltaY > 0) {
                this.scrollToPost(this.currentIndex + 1);
            } else {
                this.scrollToPost(this.currentIndex - 1);
            }
        }
    }

    toggleCaption(event: Event) {
        const target = event.currentTarget as HTMLElement;
        target.classList.toggle('expanded');
        event.stopPropagation();
    }

    onLikeDislike(blog: any, like: boolean) {
        const referenceId = blog.id;
        let newValue: boolean | null = like;
        if (this.likeDislikeMap[referenceId] === like) {
            newValue = null;
        }
        this.api.post('/posts/like-dislikes/', {
            referenceId,
            relatedTo: 'post',
            likeDislike: newValue
        }).subscribe(() => {
            if (this.likeDislikeMap[referenceId] === true && newValue === null) this.likeCountMap[referenceId] = Math.max(0, (this.likeCountMap[referenceId] || 0) - 1);
            if (this.likeDislikeMap[referenceId] === false && newValue === null) this.dislikeCountMap[referenceId] = Math.max(0, (this.dislikeCountMap[referenceId] || 0) - 1);
            if (this.likeDislikeMap[referenceId] !== true && newValue === true) {
                this.likeCountMap[referenceId] = (this.likeCountMap[referenceId] || 0) + 1;
                if (this.likeDislikeMap[referenceId] === false) this.dislikeCountMap[referenceId] = Math.max(0, (this.dislikeCountMap[referenceId] || 0) - 1);
            }
            if (this.likeDislikeMap[referenceId] !== false && newValue === false) {
                this.dislikeCountMap[referenceId] = (this.dislikeCountMap[referenceId] || 0) + 1;
                if (this.likeDislikeMap[referenceId] === true) this.likeCountMap[referenceId] = Math.max(0, (this.likeCountMap[referenceId] || 0) - 1);
            }
            this.likeDislikeMap[referenceId] = newValue;
        });
    }

    openCommentModal(blog: any) {
        this.commentModalBlog = blog;
        this.newComment = '';
        this.setShareUrls(blog);
    }

    closeCommentModal() {
        this.commentModalBlog = null;
        this.newComment = '';
    }

    submitComment(blog: any) {
        if (!this.newComment.trim()) return;
        this.isSubmittingComment = true;
        this.api.post('/posts/comments/', {
            referenceId: blog.id,
            relatedTo: 'post',
            comment: this.newComment
        }).subscribe(() => {
            this.commentsMap[blog.id] = [...(this.commentsMap[blog.id] || []), { comment: this.newComment }];
            this.isSubmittingComment = false;
            this.closeCommentModal();
        }, () => {
            this.isSubmittingComment = false;
        });
    }
}
