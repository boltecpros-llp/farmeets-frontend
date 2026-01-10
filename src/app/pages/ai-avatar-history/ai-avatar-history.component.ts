// (removed stray top-level function)
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiHelperService } from '../../shared/api-helper.service';

@Component({
  selector: 'app-ai-avatar-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-avatar-history.component.html',
  styleUrls: ['./ai-avatar-history.component.scss']
})

export class AiAvatarHistoryComponent {

  avatars: any[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;

  // Modal preview state
  previewImageUrl = signal<string | null>(null);
  previewImageAlt = signal<string>('');

  get totalPages() {
    return Math.ceil(this.total / this.pageSize) || 1;
  }

  constructor(private api: ApiHelperService) {
    this.fetchAvatars();
  }

  openPreview(url: string, alt: string) {
    this.previewImageUrl.set(url);
    this.previewImageAlt.set(alt);
    document.body.style.overflow = 'hidden';
  }

  closePreview() {
    this.previewImageUrl.set(null);
    this.previewImageAlt.set('');
    document.body.style.overflow = '';
  }

  fetchAvatars() {
    this.loading = true;
    this.api.get<any>('/accounts/api/avatars/history', {
      params: { page: this.page, page_size: this.pageSize }
    }).subscribe({
      next: (data: any) => {
        this.avatars = data.results || [];
        this.total = data.count || 0;
        this.loading = false;
      },
      error: () => {
        this.avatars = [];
        this.loading = false;
      }
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > Math.ceil(this.total / this.pageSize)) return;
    this.page = page;
    this.fetchAvatars();
  }

  async openImageInNewTab(url: string | null) {
    if (!url) return;
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'ai-avatar.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      // fallback: open in new tab if download fails
      window.open(url, '_blank');
    }
  }
}
