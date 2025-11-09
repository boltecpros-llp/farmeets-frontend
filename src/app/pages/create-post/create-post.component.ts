import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EditorComponent, EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { ApiHelperService } from '../../shared/api-helper.service';
import { HttpEventType, HttpEvent, HttpClient } from '@angular/common/http';

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

    categoryId: string | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private api: ApiHelperService,
        private http: HttpClient
    ) {
        this.form = this.fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            categories: [[]],
            images: [[]],
            videos: [[]],
            hideAuthor: [false]
        });
        // Set categoryId from route params if present
        this.route.paramMap.subscribe(params => {
            this.categoryId = params.get('categoryId');
            if (this.categoryId && this.categoryId !== 'general') {
                this.form.patchValue({ categories: [this.categoryId] });
            }
        });
    }

    onImageChange(event: any) {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) return;
        this.uploadingImages = true;
        this.imageUploadProgress = 0;
        this.uploadMedia(Array.from(files), 'posts/images', 'images').subscribe({
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
            error: () => {
                this.uploadingImages = false;
                this.imageUploadProgress = 0;
            }
        });
    }

    onVideoChange(event: any) {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) return;
        this.uploadingVideos = true;
        this.videoUploadProgress = 0;
        this.uploadMedia(Array.from(files), 'posts/videos', 'videos').subscribe({
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
            error: () => {
                this.uploadingVideos = false;
                this.videoUploadProgress = 0;
            }
        });
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
        // Use a generic upload endpoint, adjust as needed
        const apiPath = 'https://api.atlasbyargoatlantic.com/api/posts/uploads/';

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
        // Ensure categoryId is set in categories before submit
        if (this.categoryId && this.categoryId !== 'general') {
            const cats = this.form.value.categories || [];
            if (!cats.includes(this.categoryId)) {
                this.form.patchValue({ categories: [this.categoryId] });
            }
        } else if (this.categoryId === 'general') {
            // For general posts, do not set categories
            this.form.patchValue({ categories: [] });
        }
        if (this.form.valid) {
            this.api.post('/posts/posts/', this.form.value).subscribe({
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
