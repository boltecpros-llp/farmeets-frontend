import { Injectable, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiHelperService } from './api-helper.service';
import { ErrorPopupService } from './error-popup.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UserIdentityService implements OnDestroy {
  public isLoggedIn = new BehaviorSubject<boolean>(false);
  private _userDetails: any = null;
  private renderer: Renderer2;
  private lastInteraction: Date | undefined;

  constructor(
    private apiHelper: ApiHelperService,
    private rendererFactory2: RendererFactory2,
    private router: Router,
    private errorPopup: ErrorPopupService
  ) {
    this.renderer = this.rendererFactory2.createRenderer(null, null);
    this.getUserDetails();
  }

  ngOnDestroy(): void {}

  private getUserDetails() {
    const userDetailsStr = localStorage.getItem('userDetails');
    if (this.isValidToken() && userDetailsStr) {
      this.isLoggedIn.next(true);
      this._userDetails = JSON.parse(userDetailsStr);
      this.listenToUserActivity();
    } else {
      this._userDetails = null;
      this.clearUserDetails();
    }
    return this._userDetails;
  }

  public setUserDetails(user: any) {
    let userDetails = this._userDetails || {};
    // Merge new attributes into existing userDetails
    userDetails = { ...userDetails, ...user };
    localStorage.setItem('userDetails', JSON.stringify(userDetails));
    this._userDetails = userDetails;
  }

  get userDetails() {
    if (!this._userDetails?.name && this._userDetails?.firstName) {
      this._userDetails.name = (this._userDetails.firstName ? this._userDetails.firstName : '') + ' ' + (this._userDetails.lastName ? this._userDetails.lastName : '');
    }
    return this._userDetails;
  }

  storeUserDetails(accessToken: any) {
    localStorage.setItem('token', (accessToken.id || accessToken.access)?.toString());
    localStorage.setItem('userId', (accessToken.userId || accessToken.user?.id)?.toString());
    localStorage.setItem('ttl', accessToken.ttl ? accessToken.ttl?.toString() : (15 * 60).toString());
    localStorage.setItem('created', accessToken.created ? accessToken.created?.toString() : new Date().toISOString());
    if (accessToken.refreshToken || accessToken.refresh)
      localStorage.setItem('refreshToken', (accessToken.refreshToken || accessToken.refresh)?.toString());
    if (accessToken.userDetails) {
      localStorage.setItem('userDetails', JSON.stringify(accessToken.userDetails));
      this._userDetails = accessToken.userDetails;
    } else if (accessToken.user) {
      localStorage.setItem('userDetails', JSON.stringify(accessToken.user));
      this._userDetails = accessToken.user;
    }
    this.isLoggedIn.next(true);
  }

  login(credentials: any, dataModel: string = "accounts/users/login/") {
    return new Promise((resolve, reject) => {
      this.apiHelper.post<any>(dataModel, credentials).subscribe({
        next: (accessToken: any) => {
          this.storeUserDetails(accessToken);
          resolve(accessToken.userDetails);
        },
        error: (err: any) => {
          reject(err);
          let errMsg = err?.error?.error ? err.error.error.message : err.message;
          this.errorPopup.show(errMsg);
        }
      });
    });
  }

  async logout() {
    this.clearUserDetails();
    this.router.navigate(['/auth/logout']);
  }

  clearUserDetails() {
    this._userDetails = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('ttl');
    localStorage.removeItem('created');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userDetails');
    localStorage.removeItem('companyId');
    localStorage.removeItem('order');
    this.isLoggedIn.next(false);
  }

  isValidToken(): boolean {
    let token = localStorage.getItem('token');
    if (token) {
      try {
        const expiry = this.getTokenExpiry();
        return (Math.floor((new Date).getTime() / 1000)) <= expiry;
      } catch {
        return false;
      }
    } else {
      return false;
    }
  }

  getTokenExpiry(): number {
    let token = localStorage.getItem('token');
    if (!token) return 0;
    try {
      const expiry = JSON.parse(atob(token.split('.')[1])).exp;
      return expiry;
    } catch {
      return 0;
    }
  }

  private listenToUserActivity() {
    this.renderer.listen('document', 'mousemove', () => {
      this.lastInteraction = new Date();
    });
    this.renderer.listen('document', 'click', () => {
      this.lastInteraction = new Date();
    });
    this.renderer.listen('document', 'keydown', () => {
      this.lastInteraction = new Date();
    });
  }
  getUserId(): string {
    if (this._userDetails && this._userDetails.id) {
      return this._userDetails.id;
    }
    const userDetailsStr = localStorage.getItem('userDetails');
    if (userDetailsStr) {
      try {
        const user = JSON.parse(userDetailsStr);
        if (user && user.id) return user.id;
      } catch {}
    }
    return localStorage.getItem('userId') || '';
  }

  /**
   * Fetch fresh user details from API by userId
   */
  fetchUserDetailsFromApi(userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiHelper.get(`/accounts/users/${userId}/`).subscribe({
        next: (user: any) => {
          this.setUserDetails(user);
          resolve(user);
        },
        error: (err: any) => {
          reject(err);
        }
      });
    });
  }
  
}
