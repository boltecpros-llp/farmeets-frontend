import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserIdentityService } from '../../shared/user-identity.service';

@Component({
  selector: 'app-pending-for-approval',
  standalone: true,
  templateUrl: './pending-for-approval.component.html',
  styleUrls: ['./pending-for-approval.component.scss']
})
export class PendingForApprovalComponent implements OnInit {
  constructor(
    private userIdentity: UserIdentityService,
    private router: Router
  ) {}

  async ngOnInit() {
    const userId = this.userIdentity.getUserId();
    if (userId) {
      try {
        const user = await this.userIdentity.fetchUserDetailsFromApi(userId);
        // Assuming user.verified or user.isVerified or similar
        if (user.verified || user.isVerified || user.is_verified) {
          this.router.navigate(['/dashboard']);
        }
        // else stay on page
      } catch (err) {
        // Optionally handle error (e.g., show popup)
      }
    }
  }
}
