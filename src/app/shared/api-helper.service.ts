import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorPopupService } from './error-popup.service';
// import { ErrorPopupService } from './error-popup.service';

@Injectable({ providedIn: 'root' })
export class ApiHelperService {
  private baseUrl = 'https://api.atlasbyargoatlantic.com/api';

  constructor(
    private http: HttpClient,
    public errorPopup: ErrorPopupService
  ) { }

  private getHeaders(): HttpHeaders {
    let token = '';
    try {
      token = localStorage.getItem('token') || '';
    } catch {}
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private fullUrl(url: string): string {
    if (url.startsWith('http')) return url;
    return this.baseUrl + (url.startsWith('/') ? url : '/' + url);
  }

  get<T>(url: string, options: any = {}): Observable<HttpEvent<T>> {
    return this.http.get<T>(this.fullUrl(url), { ...options, headers: this.getHeaders() }).pipe(
      catchError((err: any) => this.handleError(err))
    );
  }

  post<T>(url: string, body: any, options: any = {}): Observable<HttpEvent<T>> {
    return this.http.post<T>(this.fullUrl(url), body, { ...options, headers: this.getHeaders() }).pipe(
      catchError((err: any) => this.handleError(err))
    );
  }

  patch<T>(url: string, body: any, options: any = {}): Observable<HttpEvent<T>> {
    return this.http.patch<T>(this.fullUrl(url), body, { ...options, headers: this.getHeaders() }).pipe(
      catchError((err: any) => this.handleError(err))
    );
  }

  delete<T>(url: string, options: any = {}): Observable<HttpEvent<T>> {
    return this.http.delete<T>(this.fullUrl(url), { ...options, headers: this.getHeaders() }).pipe(
      catchError((err: any) => this.handleError(err))
    );
  }

  private handleError(error: any) {
    console.log(error.error.error);
    let message = 'An unknown error occurred.';
    if (error?.error?.error?.message) {
      message = error.error.error.message;
    } else if (error?.status) {
      message = `Error ${error.status}: ${error.statusText}`;
    }
    this.errorPopup.show(message, 'error');
    return throwError(() => error);
  }
}
