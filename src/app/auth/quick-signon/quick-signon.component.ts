import { Component, OnDestroy, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserIdentityService } from '../../shared/user-identity.service';
import { ApiHelperService } from '../../shared/api-helper.service';
import { NgbActiveModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-quick-signon',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbModalModule],
  templateUrl: './quick-signon.component.html',
  styleUrls: ['./quick-signon.component.scss']
})
export class QuickSignonComponent implements OnDestroy {
  referredBy: string | null = null;
  referralLink: string = '';
  step = 1;
  form: FormGroup;
  profileForm: FormGroup;
  loading = false;
  otpSent = false;
  userDetails: any = null;
  resendTimer: number = 0;
  maxRetries: number = 3;
  retryCount: number = 0;
  resendBlocked: boolean = false;
  timerInterval: any = null;

  isModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userIdentity: UserIdentityService,
    private api: ApiHelperService,
    private route: ActivatedRoute,
    @Optional() private modal: NgbActiveModal
  ) {
    this.isModal = !!this.modal;
    this.form = this.fb.group({
      mobile: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      otp: ['']
    });
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
    // Load retry count from sessionStorage
    const storedRetry = sessionStorage.getItem('otpRetryCount');
    this.retryCount = storedRetry ? +storedRetry : 0;
    this.resendBlocked = this.retryCount >= this.maxRetries;

    // Get referredBy from query params
    this.route.queryParamMap.subscribe(params => {
      this.referredBy = params.get('referredBy');
      if (this.referredBy) {
        this.referralLink = `/auth/quick-signon?referredBy=${this.referredBy}`;
      }
    });
  }

  sendOtp(): void {
    this.loading = true;
    const mobile = this.form.get('mobile')?.value;
    const payload: any = { mobile };
    let referredByQuery = '';
    if (this.referredBy) {
      referredByQuery = '?referredBy=' + this.referredBy;
    }
    this.api.post<any>('/accounts/users/otp/' + referredByQuery, payload).subscribe({
      next: () => {
        this.otpSent = true;
        this.loading = false;
        // Load retry count from sessionStorage
        const storedRetry = sessionStorage.getItem('otpRetryCount');
        this.retryCount = storedRetry ? +storedRetry : 0;
        this.resendBlocked = this.retryCount >= this.maxRetries;
        this.startResendTimer();
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
        // Reset retry/session on success
        sessionStorage.removeItem('otpRetryCount');
        this.retryCount = 0;
        this.resendBlocked = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  updateProfile(): void {
    this.loading = true;
    const profile = this.profileForm.value;
    // Reset retry/session on success
    sessionStorage.removeItem('otpRetryCount');
    this.retryCount = 0;
    this.resendBlocked = false;
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

  startResendTimer(): void {
    this.resendTimer = 30;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  resendOtp(): void {
    if (this.resendBlocked || this.resendTimer > 0) return;
    this.retryCount++;
    sessionStorage.setItem('otpRetryCount', this.retryCount.toString());
    if (this.retryCount >= this.maxRetries) {
      this.resendBlocked = true;
      return;
    }
    this.sendOtp();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  checkPreferences(): void {
    const user = this.userIdentity.userDetails;
    if (!user?.languages?.length || !user?.categories || user.categories.length === 0) {

      this.router.navigate(['/auth/update-preference']);

    } else {
      if (this.isModal && this.modal) {
        this.modal.close(user);
      } else {
        this.router.navigate(['/']);
      }
    }
  }
}