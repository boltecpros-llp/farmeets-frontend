// Removed stray route objects above imports
import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { BlogDetails } from './shared/blog-details/blog-details';
import { BlogListing } from './shared/blog-listing/blog-listing';
import { CreatePostComponent } from './pages/create-post/create-post.component';
import { AuthGuard } from './auth/auth.guard';

import { EditProfileComponent } from './pages/edit-profile/edit-profile.component';
import { SocialCard } from './shared/social-card/social-card';
import { COMPANY_ROUTES } from './company/company.module';

export const routes: Routes = [
    // { path: '', component: Home },
    {
        path: 'edit-profile',
        component: EditProfileComponent
    },
    {
        path: 'auth',
        loadChildren: () => import('./auth/auth-routing.module').then(m => m.authRoutes)
    },
    {
        path: '',
        component: Dashboard,
        // canActivate: [AuthGuard],
        // canActivateChild: [AuthGuard],
        children: [
            { path: '', component: SocialCard },
            { path: 'blog/:blogId/:blogTitle', component: SocialCard },
            { path: 'category/:categoryId', component: BlogListing },
            { path: ':categoryId/create-post', component: CreatePostComponent, /* canActivate: [AuthGuard] */ },
            {
                path: 'view-profile/:userId',
                loadComponent: () => import('./pages/view-profile/view-profile.component').then(m => m.ViewProfileComponent)
            },
            {
                path: 'create-post/:postId',
                loadComponent: () => import('./pages/create-post/create-post.component').then(m => m.CreatePostComponent)
            },
            {
                path: 'company',
                children: COMPANY_ROUTES,
                canActivateChild: [AuthGuard]
            },
            {
                path: 'ai-farmer-generator',
                loadComponent: () => import('./shared/ai-farmer-card/ai-farmer-card.component').then(m => m.AiFarmerCardComponent)
            },
            {
                path: 'ai-avatar-history',
                loadComponent: () => import('./pages/ai-avatar-history/ai-avatar-history.component').then(m => m.AiAvatarHistoryComponent)
            },
            {
                path: 'points-referrals',
                loadComponent: () => import('./pages/points-referrals/points-referrals.component').then(m => m.PointsReferralsComponent)
            },
            {
                path: 'child-safety-policy',
                loadComponent: () => import('./pages/child-safety-policy/child-safety-policy.component').then(m => m.ChildSafetyPolicyComponent)
            },
            {
                path: 'privacy-policy',
                loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
            },
            {
                path: 'terms-and-conditions',
                loadComponent: () => import('./pages/terms-and-conditions/terms-and-conditions.component').then(m => m.TermsAndConditionsComponent)
            },
        ]
    },
    // Short referral code route: /:referralCode (must be after all specific routes)
    {
        path: ':referralCode',
        pathMatch: 'full',
        resolve: {
          // Dummy resolver to allow navigation
        },
        loadComponent: () => import('./shared/redirect-referral.component').then(m => m.RedirectReferralComponent)
    },
    {
        path: '**',
        redirectTo: ''
    }
];
