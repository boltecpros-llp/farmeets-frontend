import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { ApiHelperService } from '../../shared/api-helper.service';
import { UserIdentityService } from '../../shared/user-identity.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    form: FormGroup;
    loading = false;
    showForm = false;
    loginMode: 'email' | 'mobile' | 'both' = 'email';
    googleClientId = '625948552257-iejk25tp92hvbof5fp7m7u1nv3dvvpri.apps.googleusercontent.com';
    linkedinClientId = '78dfw8jxjweept';
    linkedinRedirectUri = window.location.origin + '/auth/login';
    dataModel = 'accounts/users/login/';
    redirectUrl: string | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private apiHelper: ApiHelperService,
        private userIdentity: UserIdentityService
    ) {
        this.form = this.fb.group({
            loginType: ['email'], // hidden field, no validation needed
            email: ['', [Validators.required, Validators.email]],
            mobile: [''],
            password: ['', Validators.required],
            rememberMe: [true]
        });
    }

    ngOnInit() {
        // If already logged in, redirect to dashboard
        if (this.userIdentity.isLoggedIn.value) {
            this.router.navigate(['/dashboard']);
            return;
        }
        // Optionally set loginMode and googleClientId from config/api if needed
        // Hide form by default, only show if no token/fragment is present
        let hasTokenOrCode = false;
        combineLatest([this.route.queryParams, this.route.fragment]).subscribe(([params, fragment]: [any, string | null]) => {
            // Only run this logic once, on the first emission
            if (hasTokenOrCode || this.showForm) return;

            if (params['redirect']) {
                this.redirectUrl = params['redirect'];
            }
            if (params['jwtToken']) {
                hasTokenOrCode = true;
                this.showForm = false;
                this.onTokenLogin(params['jwtToken']);
                return;
            } else if (params['code']) {
                hasTokenOrCode = true;
                this.showForm = false;
                this.onLinkedinLogin(params['code'], params['state']);
                return;
            }

            if (fragment && typeof fragment === 'string' && fragment.includes('id_token=')) {
                hasTokenOrCode = true;
                const fragParams = new URLSearchParams(fragment.replace('#', ''));
                const idToken = fragParams.get('id_token');
                const state = fragParams.get('state');
                if (idToken) {
                    this.showForm = false;
                    this.onGoogleLogin(idToken, state || null);
                    return;
                }
            }

            // If no token or code found, show the form
            if (!hasTokenOrCode) {
                this.showForm = true;
            }
        });
    }

    onSubmit() {
        console.log(this.form)
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        const loginType = this.form.value.loginType || 'email';
        let loginData: any = {
            password: this.form.value.password,
            rememberMe: this.form.value.rememberMe
        };
        if (this.loginMode === 'email') {
            loginData.email = this.form.value.email;
        } else if (this.loginMode === 'mobile') {
            loginData.mobile = this.form.value.mobile;
        } else if (this.loginMode === 'both') {
            loginData.emailOrMobile = loginType === 'email' ? this.form.value.email : this.form.value.mobile;
        }
        this.userIdentity.login(loginData, this.dataModel)
            .then(() => {
                this.loading = false;
                this.redirectPostLogin();
            })
            .catch(() => {
                this.loading = false;
            });
    }

    redirectPostLogin() {
        const user = this.userIdentity.userDetails;
        if (user && user.adminVerified === false) {
            this.router.navigate(['/']);
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    startGoogleOAuth() {
        if (!this.googleClientId) return;
        const redirectUri = encodeURIComponent(window.location.origin + '/auth/login');
        const scope = encodeURIComponent('openid email profile');
        const state = encodeURIComponent(Math.random().toString(36).substring(2));
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&client_id=${this.googleClientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&nonce=${state}&prompt=select_account`;
        window.location.href = oauthUrl;
    }

    onGoogleLogin(code: string, state: string | null) {
        this.userIdentity.login({ credential: code, state }, 'accounts/api/google-login/')
            .then(() => this.redirectPostLogin())
            .catch(() => this.showForm = true);
    }

    onTokenLogin(token: string) {
        this.userIdentity.login({ credential: token }, 'users/jwt-token-login/')
            .then(() => this.redirectPostLogin())
            .catch(() => this.showForm = true);
    }

    startLinkedinOAuth() {
        const clientId = this.linkedinClientId;
        const redirectUri = encodeURIComponent(this.linkedinRedirectUri);
        const state = encodeURIComponent(Math.random().toString(36).substring(2));
        const scope = encodeURIComponent('openid profile email');
        const oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
        window.location.href = oauthUrl;
    }

    onLinkedinLogin(code: string, state: string | null) {
        this.userIdentity.login({ credential: code, state }, 'accounts/api/linkedin-login/')
            .then(() => this.redirectPostLogin())
            .catch(() => this.showForm = true);
    }
}
