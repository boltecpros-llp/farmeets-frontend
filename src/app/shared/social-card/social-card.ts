import { Input } from '@angular/core';
import { Component, OnInit, Renderer2, HostListener, ViewChildren, ElementRef, AfterViewInit, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPaginationModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router, Params, RouterModule } from '@angular/router';
import { ApiHelperService } from '../api-helper.service';
import { combineLatest } from 'rxjs';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../toast/toast.service';
import { UserIdentityService } from '../user-identity.service';
import { QuickSignonComponent } from '../../auth/quick-signon/quick-signon.component';
@Component({
    selector: 'app-social-card',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbPaginationModule, RouterModule, CarouselModule, NgbDropdownModule, QuickSignonComponent],
    templateUrl: './social-card.html',
    styleUrls: ['./social-card.scss']
})
export class SocialCard implements OnInit, AfterViewInit {
    @Input() disableScroll = false;
    @Input() blogs: any[] = [];
    goToProfile(blog: any) {
        const userId = blog.author?.id;
        if (userId) {
            this.router.navigate(['/view-profile', userId]);
        }
    }
    // Returns true if logged-in user is post author
    canEditOrDelete(blog: any): boolean {
        const userId = this.userIdentity.getUserId();
        return blog.author?.id && userId && blog.author.id === userId;
    }

    onEdit(blog: any) {
        this.router.navigate([`/create-post/${blog.id}`]);
    }

    onDelete(blog: any) {
        if (!confirm('Are you sure you want to delete this post?')) return;
        this.api.delete(`/posts/posts/${blog.id}/`).subscribe({
            next: () => {
                this.toast.show('Post deleted!', 'success');
                this.fetchBlogs(true);
            },
            error: () => {
                this.toast.show('Failed to delete post', 'error');
            }
        });
    }

    @ViewChildren('postGraphicText') postGraphicTextRefs!: QueryList<ElementRef>;
    facebookShareUrl = '';
    linkedinShareUrl = '';
    whatsappShareUrl = '';
    xShareUrl = '';
    copySuccess = false;

    copyUrl(blog: any) {
        const url = blog?.shareUrl || window.location.origin + '/posts/' + blog.id;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                this.copySuccess = true;
                this.showNotification('Link copied to clipboard!');
                setTimeout(() => this.copySuccess = false, 2000);
            }).catch(() => {
                this.showNotification('Failed to copy link. Please try again.');
            });
        } else {
            this.showNotification('Clipboard API not supported.');
        }
    }

    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
        this.toast.show(message, type);
    }
    total = 0;
    page = 1;
    pageSize = 10;
    private guestPrompted = false;
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
    private pendingAction: (() => void) | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private api: ApiHelperService,
        private renderer: Renderer2,
        private el: ElementRef,
        private toast: ToastService,
        private userIdentity: UserIdentityService,
        private modalService: NgbModal
    ) { }

    ngOnInit() {
        combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, qp]) => {
            this.categoryId = params.get('categoryId') || '';
            this.page = +(qp.get('page') || 1);
            this.pageSize = +(qp.get('page_size') || 30);
            this.search = qp.get('search') || '';
            this.status = (qp.get('status') as 'Active' | 'Inactive') || 'Active';
            if (!this.disableScroll) {
                this.fetchBlogs(true);
            }
        });
    }

    ngAfterViewInit() {
        this.postCards = this.el.nativeElement.querySelectorAll('.post-card');
    }

    ngOnChanges() {

    }

    applyGraphicTextFontSizes() {
        if (this.postGraphicTextRefs && this.postGraphicTextRefs.length > 0) {
            this.postGraphicTextRefs.forEach(ref => {
                this.adjustPostGraphicTextFontSize(ref);
            });
        }
    }

    /**
     * Dynamically gets the width, height, and text content of the .post-graphic-text element,
     * calculates an appropriate font size to fit the text, and applies it.
     * For HTML content, counts only text nodes and accounts for paragraph/headings margins.
     */
    adjustPostGraphicTextFontSize(ref: ElementRef): { width: number, height: number, text: string, fontSize: number } | null {
        if (ref && ref.nativeElement) {
            const el = ref.nativeElement as HTMLElement;
            const rect = el.getBoundingClientRect();
            // Mobile bottom tab height (should match .sidebar-mobile or dashboard.scss value)
            const mobileBottomTabHeight = 0;
            // Extract only text nodes, ignore tags
            let textLength = 0;
            let paragraphCount = 0;
            let headingCount = 0;
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
            while (walker.nextNode()) {
                const node = walker.currentNode;
                if (node && node.textContent) {
                    textLength += node.textContent.trim().length;
                }
            }
            // Count paragraphs and headings for margin compensation
            paragraphCount = el.querySelectorAll('p').length;
            headingCount = el.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
            // Each paragraph/heading adds extra margin, so reduce usable height
            const marginPerBlock = 12; // px, adjust as needed
            const totalMargin = (paragraphCount + headingCount) * marginPerBlock;
            const minFontSize = 16;
            const maxFontSize = 48;
            const k = 1.2;
            const padding = 16 * 2; // left + right
            const usableWidth = Math.max(rect.width - padding, 1);
            // Subtract mobile bottom tab height in mobile view
            const usableHeight = Math.max(rect.height - padding - totalMargin - mobileBottomTabHeight, 1);
            let fontSize = (k * Math.sqrt((usableWidth * usableHeight) / Math.max(textLength, 1))) - 2;
            fontSize = Math.max(minFontSize, Math.min(fontSize, maxFontSize));
            this.renderer.setStyle(el, 'font-size', fontSize + 'px');
            this.renderer.setStyle(el, 'display', 'flex');
            this.renderer.setStyle(el, 'align-items', 'center');
            this.renderer.setStyle(el, 'justify-content', 'center');
            this.renderer.setStyle(el, 'text-align', 'center');
            this.renderer.setStyle(el, 'overflow-y', 'auto');
            this.renderer.setStyle(el, 'max-height', '');
            setTimeout(() => {
                if (fontSize === minFontSize && el.scrollHeight > el.offsetHeight) {
                    this.renderer.setStyle(el, 'max-height', (rect.height) + 'px');
                } else {
                    this.renderer.setStyle(el, 'max-height', '');
                }
            }, 0);
            return {
                width: rect.width,
                height: rect.height,
                text: el.textContent?.trim() || '',
                fontSize
            };
        }
        return null;
    }

    /**
 * Returns true if the current card's graphic text is scrollable and not at end
 */
    private isGraphicTextScrollPending(): boolean {
        if (!this.postCards.length) return false;
        const card = this.postCards[this.currentIndex];
        if (!card) return false;
        const graphicText = card.querySelector('.post-graphic-text') as HTMLElement | null;
        if (!graphicText) return false;
        const isScrollable = graphicText.style.overflowY === 'auto' || getComputedStyle(graphicText).overflowY === 'auto';
        if (!isScrollable) return false;
        // Check if not at end
        return graphicText.scrollTop + graphicText.clientHeight < graphicText.scrollHeight - 1;
    }

    fetchBlogs(reset: boolean = false) {
        // Prevent guests from fetching more than 1 page
        if (!this.userIdentity.isValidToken() && this.page > 1) {
            if (!this.guestPrompted) {
                this.guestPrompted = true;
                const modalRef = this.modalService.open(QuickSignonComponent, {
                    centered: true,
                    backdrop: 'static'
                });
                modalRef.result.finally(() => {
                    this.guestPrompted = false;
                });
            }
            return;
        }
        const params: any = {
            page: this.page,
            page_size: this.pageSize,
            status: this.status
        };
        if (this.categoryId && this.categoryId !== 'general') {
            params.category = this.categoryId;
        }
        if (this.search) params.search = this.search;
        // If blogId is present in route param, send postId as query param
        const blogId = this.route.snapshot.paramMap.get('blogId');
        if (blogId) {
            params.postId = blogId;
        }
        this.api.get<any>('/posts/posts/', { params }).subscribe({
            next: (data: any) => {
                const newBlogs = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
                this.total = data?.count || newBlogs.length;
                if (reset) {
                    this.blogs = newBlogs;
                } else {
                    this.blogs = [...this.blogs, ...newBlogs];
                }

                this.blogs = this.blogs.map(item => {
                    const randomStyle = item.textStyle || `style-${Math.floor(Math.random() * 10) + 1}`;
                    const blogTitleSlug = item.title
                        ? item.title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '').toLowerCase()
                        : (item.description
                            ? item.description.replace(/<[^>]+>/g, '') // Remove HTML tags
                                .replace(/\s+/g, ' ') // Normalize spaces
                                .trim()
                                .split(' ')
                                .map((word: string) => word.replace(/[^a-zA-Z0-9]/g, '')) // Remove non-alphanumeric chars from each word
                                .filter((word: string) => word.length > 0)
                                .slice(0, 6)
                                .join('-')
                                .toLowerCase()
                            : '');
                    const shareUrl = window.location.origin + `/blog/${item.id}/${blogTitleSlug}`;
                    const descriptionHtml = item.description || '';
                    const descriptionText = descriptionHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                    // Use socialLink and link fields for preview and link URL
                    const linkPreview = item.socialLink || null;
                    const linkUrl = item.link || '';
                    let showLinkUrl = true;
                    let showCaption = true;
                    let captionText = descriptionText;
                    // If link preview is present, hide link URL from bottom
                    if (linkPreview) {
                        showLinkUrl = false;
                    }
                    // If link and description are same, don't show caption
                    if (linkUrl && descriptionText && descriptionText.trim() === linkUrl.trim()) {
                        showCaption = false;
                    }
                    // If caption/description has more content along with link, remove link from caption
                    if (linkUrl && showCaption && descriptionText.includes(linkUrl)) {
                        captionText = descriptionText.replace(linkUrl, '').replace(/\s+/g, ' ').trim();
                    }
                    return {
                        ...item,
                        textStyle: randomStyle,
                        shareUrl,
                        socialUrls: {
                            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                            linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(captionText)}&summary=${encodeURIComponent(captionText)}`,
                            whatsapp: `https://wa.me/?text=${encodeURIComponent(captionText + ' ' + shareUrl)}`,
                            x: `https://x.com/intent/tweet?text=${encodeURIComponent(captionText + ' ' + shareUrl)}`
                        },
                        showLinkUrl,
                        showCaption,
                        captionText,
                        linkPreview,
                        linkUrl
                    };
                });

                setTimeout(() => {
                    this.postCards = this.el.nativeElement.querySelectorAll('.post-card');
                    this.applyGraphicTextFontSizes();
                }, 100);

                this.blogs.forEach((blog: any) => {
                    this.likeDislikeMap[blog.id] = blog.likeDislike;
                    this.likeCountMap[blog.id] = blog.likes_count || 0;
                    this.dislikeCountMap[blog.id] = blog.dislikes_count || 0;
                    this.commentsMap[blog.id] = blog.comments || [];
                });

            },
            error: () => {
                if (reset) {
                    this.blogs = [];
                }
                setTimeout(() => {
                    this.postCards = this.el.nativeElement.querySelectorAll('.post-card');
                    this.applyGraphicTextFontSizes();
                }, 100);

                this.likeDislikeMap = {};
                this.likeCountMap = {};
                this.dislikeCountMap = {};
                this.commentsMap = {};

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
        if (this.disableScroll) return;
        if (this.isScrolling) return;
        if (e.deltaY > 0) {
            if (this.isGraphicTextScrollPending()) {
                // Let user scroll graphic text, not card
                return;
            }
            this.scrollToPost(this.currentIndex + 1);
        } else if (e.deltaY < 0) {
            this.scrollToPost(this.currentIndex - 1);
        }
    }

    touchStartY = 0;
    @HostListener('window:touchstart', ['$event'])
    onTouchStart(e: TouchEvent) {
        if (this.disableScroll) return;
        if (e.touches.length > 1) return;
        this.touchStartY = e.touches[0].clientY;
    }
    @HostListener('window:touchend', ['$event'])
    onTouchEnd(e: TouchEvent) {
        if (this.disableScroll) return;
        if (e.changedTouches.length > 1) return;
        const deltaY = this.touchStartY - e.changedTouches[0].clientY;
        if (Math.abs(deltaY) > 20) {
            if (deltaY > 0) {
                if (this.isGraphicTextScrollPending()) {
                    // Let user scroll graphic text, not card
                    return;
                }
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

    private checkLoginOrPrompt(action: () => void) {
        if (this.userIdentity.isValidToken()) {
            action();
        } else {
            this.pendingAction = action;
            const modalRef = this.modalService.open(QuickSignonComponent,
                {
                    centered: true,
                    backdrop: 'static'
                }
            );
            modalRef.result.then(
                () => {
                    if (this.userIdentity.isValidToken() && this.pendingAction) {
                        this.pendingAction();
                        this.pendingAction = null;
                    }
                },
                () => {
                    this.pendingAction = null;
                }
            );
        }
    }
    onLikeDislike(blog: any, like: boolean) {
        this.checkLoginOrPrompt(() => {
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
        });
    }

    openCommentModal(blog: any) {
        this.commentModalBlog = blog;
        this.newComment = '';
    }

    closeCommentModal() {
        this.commentModalBlog = null;
        this.newComment = '';
    }

    submitComment(blog: any) {
        if (!this.newComment.trim()) return;
        this.checkLoginOrPrompt(() => {
            this.isSubmittingComment = true;
            this.api.post('/posts/comments/', {
                referenceId: blog.id,
                relatedTo: 'post',
                message: this.newComment
            }).subscribe(() => {
                this.commentsMap[blog.id] = [...(this.commentsMap[blog.id] || []), { message: this.newComment }];
                this.isSubmittingComment = false;
                this.closeCommentModal();
            }, () => {
                this.isSubmittingComment = false;
            });
        });
    }

    encodeUrl(url: string): string {
        return encodeURIComponent(url);
    }

    @HostListener('window:scroll', [])
    onWindowScroll() {
        if (this.isScrolling) return;
        // Only trigger if there are more posts to load
        if (this.blogs.length >= this.total) return;
        // Find the second-to-last post card
        if (this.postCards.length < 2) return;
        const secondLastCard = this.postCards[this.postCards.length - 2];
        if (!secondLastCard) return;
        const rect = secondLastCard.getBoundingClientRect();
        // If the second-to-last card is visible in the viewport
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            if (!this.userIdentity.isValidToken() && this.page > 1) return; // Guest block for page > 1
            this.page++;
            this.fetchBlogs(false);
        }
    }
}
