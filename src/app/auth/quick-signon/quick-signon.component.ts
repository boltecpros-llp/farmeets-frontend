import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserIdentityService } from '../../shared/user-identity.service';

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
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userIdentity: UserIdentityService
  ) {
    this.form = this.fb.group({
      mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      otp: ['']
    });
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  sendOtp() {
    // Call API to send OTP
    this.otpSent = true;
  }

  verifyOtp() {
    // Call API to verify OTP and login
    // On success, check profile fields
    const user = this.userIdentity.userDetails;
    if (!user?.firstName || !user?.lastName) {
      this.step = 2;
    } else {
      this.checkPreferences();
    }
  }

  updateProfile() {
    // Call API to update profile
    // Patch user profile with firstName, lastName, email
    this.userIdentity.setUserDetails(this.profileForm.value);
    this.checkPreferences();
  }

  checkPreferences() {
    const user = this.userIdentity.userDetails;
    if (!user?.language || !user?.categories || user.categories.length === 0) {
      this.router.navigate(['/auth/update-preference']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
