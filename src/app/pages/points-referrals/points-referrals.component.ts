
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { UserIdentityService } from '../../shared/user-identity.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-points-referrals',
  templateUrl: './points-referrals.component.html',
  styleUrls: ['./points-referrals.component.scss']
})
export class PointsReferralsComponent implements AfterViewInit {
  points: number|null = null;
  referralCode: string|null = null;
  referralLink: string|null = null;
  @ViewChild('qrCanvas', { static: false }) qrCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private userIdentity: UserIdentityService, private toast: ToastService) {
    const user = this.userIdentity.userDetails;
    this.points = user?.pointsEarned || user?.points || 0;
    this.referralCode = user?.referralCode || user?.referral_code || '';
    this.referralLink = window.location.origin + '/' + this.referralCode;
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

