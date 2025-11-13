import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserIdentityService } from '../../shared/user-identity.service';
import { ApiHelperService } from '../../shared/api-helper.service';

@Component({
  selector: 'app-quick-signon',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './quick-signon.component.html',
  styleUrls: ['./quick-signon.component.scss']
})
export class QuickSignonComponent {
  step = 1;
  form: FormGroup;
  profileForm: FormGroup;
  loading = false;
  otpSent = false;
  userDetails: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userIdentity: UserIdentityService,
    private api: ApiHelperService
  ) {
    this.form = this.fb.group({
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      otp: ['']
    });
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  sendOtp(): void {
    this.loading = true;
    const mobile = this.form.get('mobile')?.value;
    this.api.post<any>('/accounts/users/otp/', { mobile }).subscribe({
      next: () => {
        this.otpSent = true;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  verifyOtp(): void {
    this.loading = true;
    const mobile = this.form.get('mobile')?.value;
    const otp = this.form.get('otp')?.value;
    this.api.post<any>('/accounts/users/verify-otp/', { mobile, otp }).subscribe({
      next: (res: any) => {
        if (res) {
          this.userIdentity.storeUserDetails(res);
          this.userDetails = this.userIdentity.userDetails;
        }
        if (!this.userDetails?.firstName || !this.userDetails?.lastName) {
          this.step = 2;
        } else {
          this.checkPreferences();
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    this.loading = true;
    const profile = this.profileForm.value;
    this.api.patch<any>('accounts/users/' + this.userDetails.id + "/", profile).subscribe({
      next: (res: any) => {
        if (res) {
          this.userIdentity.setUserDetails(res);
        } else {
          this.userIdentity.setUserDetails(profile);
        }
        this.checkPreferences();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  checkPreferences(): void {
    const user = this.userIdentity.userDetails;
    if (!user?.languages?.length || !user?.categories || user.categories.length === 0) {
      this.router.navigate(['/auth/update-preference']);
    } else {
      this.router.navigate(['/']);
    }
  }
  // ...existing code...
}
