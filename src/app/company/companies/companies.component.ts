// This file has been moved to c:\Users\vilas\Downloads\farmeets-frontend\src\app\company\companies\companies.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiHelperService } from '../../shared/api-helper.service';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { UserIdentityService } from '../../shared/user-identity.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss']
})
export class CompaniesComponent implements OnInit {
  companies: any[] = [];

  constructor(
    private api: ApiHelperService,
    private route: ActivatedRoute,
    private userIdentity: UserIdentityService
  ) {}

  // Called on component initialization
  ngOnInit() {
    const url = this.route.snapshot.routeConfig?.path;
    if (url === 'my-companies') {
      this.loadUserCompanies();
    } else {
      this.loadAllCompanies();
    }
  }

  // Fetch all companies
  loadAllCompanies() {
    this.api.get('/accounts/company/').subscribe({
      next: (data: any) => this.companies = Array.isArray(data) ? data : (data?.results || []),
      error: err => console.error(err)
    });
  }

  // Fetch companies for the current user
  loadUserCompanies() {
    const userId = this.userIdentity.getUserId();
    this.api.get(`/accounts/company/user/${userId}/`).subscribe({
      next: (data: any) => this.companies = Array.isArray(data) ? data : (data?.results || []),
      error: err => console.error(err)
    });
  }
}
