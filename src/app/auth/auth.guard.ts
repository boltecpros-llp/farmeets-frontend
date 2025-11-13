import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserIdentityService } from '../shared/user-identity.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(
    private router: Router,
    private userIdentity: UserIdentityService
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const isAuthenticated = this.userIdentity.isValidToken();
    if (isAuthenticated) {
      const user = this.userIdentity.userDetails;
      // Check for missing language or categories
      console.log(user, user?.language, user?.categories);  
      /* if (!user?.language || !user?.categories || user.categories.length === 0) {
        if (next.routeConfig?.path !== 'auth/update-preference') {
          this.router.navigate(['/auth/update-preference']);
          return false;
        }
      } */
      if (next.routeConfig?.path?.includes('auth')) {
        this.router.navigate(['/']);
        return false;
      }
      return true;
    } else {
      if (!next.routeConfig?.path?.includes('auth')) {
        this.router.navigate(['auth/login'], { queryParams: next.queryParams });
        return false;
      }
      return true;
    }
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const isAuthenticated = this.userIdentity.isValidToken();
    if (isAuthenticated) {
      const user = this.userIdentity.userDetails;
      // Check for missing language or categories
      console.log(user, user?.language, user?.categories);
      /* if (!user?.language || !user?.categories || user.categories.length === 0) {
        if (childRoute.routeConfig?.path !== 'auth/update-preference') {
          this.router.navigate(['/auth/update-preference']);
          return false;
        }
      } */
      if (childRoute.routeConfig?.path?.includes('auth')) {
        this.router.navigate(['/']);
        return false;
      }
      return true;
    } else {
      if (!childRoute.routeConfig?.path?.includes('auth')) {
        this.router.navigate(['auth/login']);
        return false;
      }
      return true;
    }
  }
}
