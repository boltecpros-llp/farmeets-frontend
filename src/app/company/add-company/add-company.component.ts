import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiHelperService } from '../../shared/api-helper.service';
import { ToastService } from '../../shared/toast/toast.service';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { HttpClient, HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-add-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EditorComponent],
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }
  ],
  templateUrl: './add-company.component.html',
  styleUrls: ['./add-company.component.scss']
})
export class AddCompanyComponent {
  imagePreviews: string[] = [];
  videoPreviews: string[] = [];
  uploadingImages = false;
  uploadingVideos = false;
  imageUploadProgress: number = 0;
  videoUploadProgress: number = 0;
  form: FormGroup;
  uploadingLogo = false;
  logoPreview: string = '';
  categories: any[] = [];
  languages: any[] = [];
  tinymceConfig: any = {
    height: 300,
    menubar: false,
    plugins: 'lists link image code',
    toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | code',
    statusbar: false
  };
  constructor(private fb: FormBuilder, private api: ApiHelperService, private router: Router, private http: HttpClient, private toast: ToastService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      logo: [''],
      companyType: ['FPO', Validators.required],
      category_ids: [[], Validators.required],
      language_ids: [[], Validators.required],
      images: [[]],
      videos: [[]]
    });
    this.api.get('/posts/categories/hierarchy/').subscribe({
      next: (data: any) => {
        this.categories = Array.isArray(data) ? data : [];
      },
      error: err => console.error(err)
    });
    this.api.get('/posts/languages/').subscribe({
      next: (data: any) => {
        this.languages = Array.isArray(data) ? data : [];
      },
      error: err => console.error(err)
    });
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.uploadingLogo = true;
    this.uploadMedia(file, 'company/logo', 'logo').subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.Response) {
          const uploaded = event.body || [];
          const url = Array.isArray(uploaded) && uploaded.length > 0 ? uploaded[0].file_url : '';
          this.logoPreview = url;
          this.form.patchValue({ logo: url });
          this.uploadingLogo = false;
        }
      },
      error: (err) => {
        this.uploadingLogo = false;
        if (err?.status === 401) {
          this.toast.show('Login first to upload logo.', 'error');
        } else {
          this.toast.show('Logo upload failed.', 'error');
        }
      }
    });
  }

  onMediaChange(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    const imageFiles: File[] = [];
    const videoFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      } else if (file.type.startsWith('video/')) {
        videoFiles.push(file);
      }
    });
    if (imageFiles.length > 0) {
      this.uploadingImages = true;
      this.imageUploadProgress = 0;
      this.uploadMedia(imageFiles, 'company/images', 'images').subscribe({
        next: (event: any) => {
          if (event.progress !== undefined) {
            this.imageUploadProgress = event.progress;
          }
          if (event.type === HttpEventType.Response) {
            const uploaded = event.body || [];
            const urls = Array.isArray(uploaded) ? uploaded.map((f: any) => f.file_url) : [];
            this.form.patchValue({ images: urls });
            this.imagePreviews = urls;
            this.uploadingImages = false;
            this.imageUploadProgress = 100;
          }
        },
        error: (err) => {
          this.uploadingImages = false;
          this.imageUploadProgress = 0;
          if (err?.status === 401) {
            this.toast.show('Login first to upload images.', 'error');
          } else {
            this.toast.show('Image upload failed.', 'error');
          }
        }
      });
    }
    if (videoFiles.length > 0) {
      this.uploadingVideos = true;
      this.videoUploadProgress = 0;
      this.uploadMedia(videoFiles, 'company/videos', 'videos').subscribe({
        next: (event: any) => {
          if (event.progress !== undefined) {
            this.videoUploadProgress = event.progress;
          }
          if (event.type === HttpEventType.Response) {
            const uploaded = event.body || [];
            const urls = Array.isArray(uploaded) ? uploaded.map((f: any) => f.file_url) : [];
            this.form.patchValue({ videos: urls });
            this.videoPreviews = urls;
            this.uploadingVideos = false;
            this.videoUploadProgress = 100;
          }
        },
        error: (err) => {
          this.uploadingVideos = false;
          this.videoUploadProgress = 0;
          if (err?.status === 401) {
            this.toast.show('Login first to upload videos.', 'error');
          } else {
            this.toast.show('Video upload failed.', 'error');
          }
        }
      });
    }
  }

  uploadMedia(fileOrFiles: File | File[], folderName?: string, urlType?: string, fileUploadOptions?: any) {
    const isMultiple = Array.isArray(fileOrFiles);
    const filesArray: File[] = isMultiple ? fileOrFiles as File[] : [fileOrFiles as File];
    const formData = new FormData();
    filesArray.forEach(f => formData.append('files', f));
    const apiPath = this.api.baseUrl + '/posts/uploads/';
    const token = localStorage.getItem('token');
    return this.http.post<any>(apiPath, formData, {
      reportProgress: true,
      observe: 'events',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
  }

  onCategoryToggle(catId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.get('category_ids')?.value as string[];
    let updated: string[];
    if (checked) {
      updated = [...current, catId];
    } else {
      updated = current.filter(id => id !== catId);
    }
    this.form.get('category_ids')?.setValue(updated);
    this.form.get('category_ids')?.markAsTouched();
  }

  onLanguageToggle(langId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.get('language_ids')?.value as string[];
    let updated: string[];
    if (checked) {
      updated = [...current, langId];
    } else {
      updated = current.filter(id => id !== langId);
    }
    this.form.get('language_ids')?.setValue(updated);
    this.form.get('language_ids')?.markAsTouched();
  }

  onSubmit() {
    if (this.form.valid) {
      this.api.post('/accounts/company/', this.form.value).subscribe({
        next: () => this.router.navigate(['/companies']),
        error: err => console.error(err)
      });
    }
  }
}
