import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiHelperService } from '../../shared/api-helper.service';

@Component({
  selector: 'app-view-company',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-company.component.html',
  styleUrls: ['./view-company.component.scss']
})
export class ViewCompanyComponent implements OnInit {
  company: any = null;
  constructor(private route: ActivatedRoute, private api: ApiHelperService) {}
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.get(`/accounts/company/${id}/`).subscribe({
        next: (data: any) => this.company = data,
        error: err => console.error(err)
      });
    }
  }
  get categoryNames(): string {
    return Array.isArray(this.company?.categories) && this.company.categories.length
      ? this.company.categories.map((c: any) => c.name).join(', ')
      : '';
  }

  get languageNames(): string {
    return Array.isArray(this.company?.languages) && this.company.languages.length
      ? this.company.languages.map((l: any) => l.name).join(', ')
      : '';
  }
}
