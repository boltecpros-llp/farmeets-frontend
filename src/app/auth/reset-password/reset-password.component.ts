import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiHelperService } from '../../shared/api-helper.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  config: any = {};
  data: any = {};
  submitted = false;
  loading = false;
  errorMsg = '';
  form!: FormGroup;
  token = '';
  private route = inject(ActivatedRoute);
  private api = inject(ApiHelperService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private defaultConfig = {
    resetPasswordHeadingClass: 'fw-light',
    resetPasswordSubHeadingClass: 'fw-light mb-3 text-muted',
    resetPasswordFormWrapperClass: '',
    resetPasswordLoginLinkClass: 'mt-3',
    resetPasswordSubmittedDescriptionClass: 'outer-link',
    resetPasswordSubmittedLoginLinkClass: 'outer-link',
  };
  private defaultData = {
    resetPasswordHeading: 'Set New Password',
    resetPasswordSubHeading: 'Your password should be unique just like you',
    resetPasswordLoginLinkText: 'Login Now',
    resetPasswordSubmittedDescription: 'You have successfully changed your password.',
    resetPasswordSubmittedLoginText: 'Login',
  };

  ngOnInit() {
    this.config = { ...this.defaultConfig };
    this.data = { ...this.defaultData };
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  onSubmit() {
    this.errorMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { newPassword, confirmPassword } = this.form.value;
    if (newPassword !== confirmPassword) {
      this.errorMsg = "Passwords don't match.";
      return;
    }
    this.loading = true;
    const queryString = Object.keys(this.route.snapshot.queryParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(this.route.snapshot.queryParams[key])}`)
      .join('&');

    this.api.post(`/accounts/users/confirm-password-reset/${this.token}/?${queryString}`, {
      newPassword,
      confirmPassword,
      token: this.token
    }).subscribe({
      next: () => {
        this.submitted = true;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.error?.message || 'Invalid URL or Token Expired. Please try again.';
      }
    });
  }
}
