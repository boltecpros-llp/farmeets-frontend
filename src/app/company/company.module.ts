import { Routes } from '@angular/router';
import { AddCompanyComponent } from './add-company/add-company.component';
import { CompaniesComponent } from './companies/companies.component';
import { ViewCompanyComponent } from './view-company/view-company.component';
import { AuthGuard } from '../auth/auth.guard';

export const COMPANY_ROUTES: Routes = [
  { path: '', component: CompaniesComponent, canActivate: [AuthGuard] },
  { path: 'add', component: AddCompanyComponent, canActivate: [AuthGuard] },
  { path: ':id', component: ViewCompanyComponent, canActivate: [AuthGuard] }
];
