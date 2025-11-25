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
                { path: ':categoryId/create-post', component: CreatePostComponent, canActivate: [AuthGuard] },
                {
                    path: 'create-post/:postId',
                    loadComponent: () => import('./pages/create-post/create-post.component').then(m => m.CreatePostComponent)
                },
            {
                path: 'company',
                children: COMPANY_ROUTES,
                canActivateChild: [AuthGuard]
            },
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
