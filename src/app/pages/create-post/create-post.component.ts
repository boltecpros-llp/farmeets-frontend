// ...existing imports...
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { ApiHelperService } from '../../shared/api-helper.service';
import { HttpEventType, HttpClient } from '@angular/common/http';
import { UserIdentityService } from '../../shared/user-identity.service';
import { franc } from 'franc';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
    selector: 'app-create-post',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, EditorComponent],
    providers: [
        { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }
    ],
    templateUrl: './create-post.component.html',
    styleUrls: ['./create-post.component.scss']
})
export class CreatePostComponent {
        onCategoryToggle(catId: string, event: Event) {
            const checked = (event.target as HTMLInputElement).checked;
            const current = this.form.get('categories')?.value as string[];
            let updated: string[];
            if (checked) {
                updated = [...current, catId];
            } else {
                updated = current.filter(id => id !== catId);
            }
            this.form.get('categories')?.setValue(updated);
            this.form.get('categories')?.markAsTouched();
        }
    categories: any[] = [];
    languages: any[] = [];
    form: FormGroup;
    imagePreviews: string[] = [];
    videoPreviews: string[] = [];
    uploadingImages = false;
    uploadingVideos = false;
    imageUploadProgress: number = 0;
    videoUploadProgress: number = 0;
    tinymceConfig: any = {
        height: 300,
        menubar: false,
        plugins: 'lists link image code',
        toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | code',
        statusbar: false
    };

    constructor(
        private fb: FormBuilder,
        public router: Router,
        private api: ApiHelperService,
        private http: HttpClient,
        private userIdentity: UserIdentityService,
        private toast: ToastService
    ) {
        this.form = this.fb.group({
            description: ['', Validators.required],
            categories: [[], Validators.required],
            images: [[]],
            videos: [[]],
            hideAuthor: [false],
            language: ['en']
        });
        // Load categories from user details
        const userDetails = this.userIdentity.userDetails;
        this.categories = Array.isArray(userDetails?.categories) ? userDetails.categories : [];
        this.languages = Array.isArray(userDetails?.languages) ? userDetails.languages : [];
        console.log(this.categories);

        // Subscribe to description changes for language detection
        this.descriptionControl.valueChanges.subscribe((text: string) => {
            const lang = this.detectLanguage(text);
            if (lang !== this.form.get('language')?.value) {
                this.form.patchValue({ language: lang });
            }
        });
    }

    detectLanguage(text: string): string {
        if (!text) return 'en';
        const isoToIndianCode: { [iso: string]: string } = {
            'eng': 'en', 'hin': 'hi', 'mar': 'mr', 'guj': 'gu', 'tam': 'ta', 'tel': 'te', 'kan': 'kn', 'mal': 'ml',
            'pan': 'pa', 'ben': 'bn', 'ori': 'or', 'asm': 'as', 'urd': 'ur', 'snd': 'sd', 'kas': 'ks', 'san': 'sa',
            'bho': 'bho', 'nep': 'ne', 'doi': 'doi', 'sat': 'san', 'kok': 'kok'
        };
        const iso = franc(text);
        let lang = isoToIndianCode[iso] || 'en';
        return lang;
    }

    // onEditorChange removed; handled by valueChanges subscription

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
            this.uploadMedia(imageFiles, 'posts/images', 'images').subscribe({
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
                    if (err.status === 401) {
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
            this.uploadMedia(videoFiles, 'posts/videos', 'videos').subscribe({
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
                    if (err.status === 401) {
                        this.toast.show('Login first to upload videos.', 'error');
                    } else {
                        this.toast.show('Video upload failed.', 'error');
                    }
                }
            });
        }
    }

    uploadMedia(fileOrFiles: File | File[], folderName?: string, urlType?: string, fileUploadOptions?: any) {
        // Determine if single or multiple files
        const isMultiple = Array.isArray(fileOrFiles);
        const filesArray: File[] = isMultiple ? fileOrFiles as File[] : [fileOrFiles as File];

        const formData = new FormData();
        filesArray.forEach(f => formData.append('files', f));
        // formData.append('folderName', 'folderName');
        // formData.append('meta', JSON.stringify({ foo: 'bar' })); // extra JSON data

        // Do NOT set Content-Type header manually; let the browser set it
        // Use baseUrl from ApiHelperService
        const apiPath = this.api.baseUrl + '/posts/uploads/';

        const token = localStorage.getItem('token');
        return this.http.post<any>(apiPath, formData, {
            reportProgress: true,
            observe: 'events',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined
        }).pipe(
            // @ts-ignore
            // RxJS map/catchError imports assumed available in ApiHelperService
            // If not, import them here
            // Use map/catchError as in your working code
            // For brevity, error handling is basic here
            // You can expand as needed
        );
    }

    onSubmit() {
        // Convert language isoCode to id before submit
        const formValue = { ...this.form.value };
        const selectedLang = this.languages.find(lang => lang.isoCode === formValue.language);
        if (selectedLang) {
            formValue.language = selectedLang.id;
        }
        // Extract first http/https URL (full domain and path) from description and add to 'link' field
        const urlRegex = /(https?:\/\/(?:[\w-]+\.)+[\w-]+(?:\:[0-9]+)?(?:\/[\w\-\.~:\/?#\[\]@!$&'()*+,;=%]*)?)/i;
        const desc = formValue.description || '';
        const match = desc.match(urlRegex);
        formValue.link = match ? match[0] : '';
        console.log(formValue);
        if (this.form.valid) {
            this.api.post('/posts/posts/', formValue).subscribe({
                next: (res) => {
                    this.api.errorPopup.show('Post created!');
                    console.log(res);
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    console.error(err);
                }
            });
        }
    }

    get descriptionControl() {
        return this.form.get('description')! as FormControl;
    }
}
