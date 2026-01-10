
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { UserIdentityService } from '../../shared/user-identity.service';
import { ToastService } from '../../shared/toast/toast.service';
import { ApiHelperService } from '../../shared/api-helper.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-points-referrals',
  templateUrl: './points-referrals.component.html',
  styleUrls: ['./points-referrals.component.scss'],
  imports: [CommonModule]
})
export class PointsReferralsComponent implements AfterViewInit {
  points: number|null = null;
  referralCode: string|null = null;
  referralLink: string|null = null;
  @ViewChild('qrCanvas', { static: false }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  referrals: any[] = [];
  referralsCount = 0;
  referralsPoints = 0;
  loading = false;

  constructor(private userIdentity: UserIdentityService, private toast: ToastService, private api: ApiHelperService) {
    const user = this.userIdentity.userDetails;
    this.referralCode = user?.referralCode || user?.referral_code || '';
    this.referralLink = window.location.origin + '/' + this.referralCode;
    this.fetchReferrals();
  }

  fetchReferrals() {
    this.loading = true;
    this.api.get<any>('/accounts/users/my-referrals/').subscribe({
      next: (data: any) => {
        const results = data?.results || {};
        this.referrals = results.referrals || [];
        this.referralsCount = results.totalReferrals || 0;
        this.referralsPoints = results.pointsEarned || 0;
        this.points = results.pointsEarned || 0;
        this.loading = false;
      },
      error: () => {
        this.referrals = [];
        this.referralsCount = 0;
        this.referralsPoints = 0;
        this.points = 0;
        this.loading = false;
      }
    });
  }

  ngAfterViewInit() {
    this.generateQrCode();
  }

  generateQrCode() {
    // Use QRious via CDN
    const scriptId = 'qrious-cdn';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js';
      script.onload = () => this.renderQr();
      document.body.appendChild(script);
    } else {
      this.renderQr();
    }
  }

  renderQr() {
    // @ts-ignore
    if (window.QRious && this.qrCanvas) {
      // @ts-ignore
      new window.QRious({
        element: this.qrCanvas.nativeElement,
        value: this.referralLink,
        size: 180
      });
    }
  }

  copyReferralLink() {
    if (this.referralLink) {
      navigator.clipboard.writeText(this.referralLink);
      this.toast.show('Referral link copied!', 'success');
    }
  }
}

