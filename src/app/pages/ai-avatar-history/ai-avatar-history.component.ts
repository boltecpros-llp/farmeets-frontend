import { Component } from '@angular/core';
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
  get totalPages() {
    return Math.ceil(this.total / this.pageSize) || 1;
  }

  constructor(private api: ApiHelperService) {
    this.fetchAvatars();
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
}
