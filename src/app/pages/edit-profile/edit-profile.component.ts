import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserIdentityService } from '../../shared/user-identity.service';
import { ApiHelperService } from '../../shared/api-helper.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss']
})
export class EditProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  user: any;
  uploadingProfilePic = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onProfilePicChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.uploadingProfilePic = true;
    this.uploadMedia(file).subscribe({
      next: (event: any) => {
        if (event.type === 4 && event.body && Array.isArray(event.body) && event.body[0]?.file_url) {
          const url = event.body[0].file_url;

          this.api.patch('/accounts/users/' + this.user.id + '/', { profilePicture: url, email: this.user.email }).subscribe({
            next: () => {
              this.user.profilePicture = url;
              // Update local storage using UserIdentityService
              this.userIdentity.setUserDetails({ profilePicture: url });
              this.uploadingProfilePic = false;
            },
            error: () => {
              this.uploadingProfilePic = false;
            }
          });
        }
      },
      error: () => {
        this.uploadingProfilePic = false;
      }
    });
  }

  uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('files', file);
    const apiPath = 'https://api.atlasbyargoatlantic.com/api/posts/uploads/';
    const token = localStorage.getItem('token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<any>(apiPath, formData, {
      reportProgress: true,
      observe: 'events',
      headers
    });
  }
  passwordChanged = signal(false);

  constructor(
    private fb: FormBuilder,
    private userIdentity: UserIdentityService,
    private api: ApiHelperService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.user = this.userIdentity.userDetails;
    this.profileForm = this.fb.group({
      firstName: [{ value: this.user?.firstName || '', disabled: true }],
      lastName: [{ value: this.user?.lastName || '', disabled: true }],
      email: [{ value: this.user?.email || '', disabled: true }],
      phone: [{ value: this.user?.phone || '', disabled: true }],
      // Add more fields as needed
    });
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;
    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;
    this.api.post('/accounts/users/change-password/', { oldPassword, newPassword, confirmPassword }).subscribe({
      next: () => {
        this.passwordChanged.set(true);
      }
    });
  }
}
