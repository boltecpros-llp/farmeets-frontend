

import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth.component').then(m => m.AuthComponent),
    children: [
  { path: 'quick-signon', loadComponent: () => import('./quick-signon/quick-signon.component').then(m => m.QuickSignonComponent) },
  { path: 'quick-signon', loadComponent: () => import('./quick-signon/quick-signon.component').then(m => m.QuickSignonComponent) },
  { path: 'register', loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'logout', loadComponent: () => import('./logout/logout.component').then(m => m.LogoutComponent) },
  { path: 'reset-password/:token', loadComponent: () => import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'verify-user/:uid/:token', loadComponent: () => import('./verify-user/verify-user.component').then(m => m.VerifyUserComponent) },
  { path: 'update-preference', loadComponent: () => import('./update-preference/update-preference.component').then(m => m.UpdatePreferenceComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];
