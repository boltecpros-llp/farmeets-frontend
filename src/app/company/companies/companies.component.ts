// This file has been moved to c:\Users\vilas\Downloads\farmeets-frontend\src\app\company\companies\companies.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiHelperService } from '../../shared/api-helper.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss']
})
export class CompaniesComponent implements OnInit {
  companies: any[] = [];
  constructor(private api: ApiHelperService) {}
  ngOnInit() {
    this.api.get('/accounts/company/').subscribe({
      next: (data: any) => this.companies = Array.isArray(data) ? data : (data?.results || []),
      error: err => console.error(err)
    });
  }
}
