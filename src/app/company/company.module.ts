import { Routes } from '@angular/router';
import { AddCompanyComponent } from './add-company/add-company.component';
import { CompaniesComponent } from './companies/companies.component';
import { ViewCompanyComponent } from './view-company/view-company.component';

export const COMPANY_ROUTES: Routes = [
  { path: '', component: CompaniesComponent },
  { path: 'add', component: AddCompanyComponent },
  { path: ':id', component: ViewCompanyComponent }
];
