import { Component, inject, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  template: ''
})
export class RedirectReferralComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const referralCode = this.route.snapshot.paramMap.get('referralCode');
    if (referralCode) {
      localStorage.setItem('referredBy', referralCode);
      this.router.navigate(['/auth/quick-signon'], { queryParams: { referredBy: referralCode } });
    } else {
      this.router.navigate(['/']);
    }
  }
}