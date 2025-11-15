import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiHelperService } from '../../shared/api-helper.service';
import { NgxIntlTelInputModule, SearchCountryField, CountryISO, PhoneNumberFormat } from 'ngx-intl-tel-input';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        NgxIntlTelInputModule,
        
    ],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

    public SearchCountryField = SearchCountryField;
    public CountryISO = CountryISO;
    public PhoneNumberFormat = PhoneNumberFormat

    form: FormGroup;
    loading = false;
    success = false;
    errorMsg = '';
    googleClientId = '625948552257-iejk25tp92hvbof5fp7m7u1nv3dvvpri.apps.googleusercontent.com';

    constructor(private fb: FormBuilder, private api: ApiHelperService, private router: Router) {
        this.form = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            mobile: [undefined, Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordsMatchValidator });
    }

    passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordsMismatch: true };
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        const { confirmPassword, ...userData } = this.form.value;
        userData.confirmPassword = confirmPassword;
        userData.mobile = this.form.value.mobile?.internationalNumber || '';
        this.api.post('/accounts/users/', userData).subscribe({
            next: () => {
                this.loading = false;
                this.success = true;
                this.router.navigate(['/auth/quick-signon']);
            },
            error: (err) => {
                this.loading = false;
                this.errorMsg = err?.error?.detail || 'Registration failed.';
            }
        });
    }

    startGoogleOAuth() {
        if (!this.googleClientId) return;
        const redirectUri = encodeURIComponent(window.location.origin + '/auth/quick-signon');
        const scope = encodeURIComponent('openid email profile');
        const state = encodeURIComponent(Math.random().toString(36).substring(2));
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=id_token&client_id=${this.googleClientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&nonce=${state}&prompt=select_account`;
        window.location.href = oauthUrl;
    }
}
