// ...existing imports...
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
    isCategorySelected(id: string): boolean {
        return this.selectedCategories.some(c => c.id === id);
    }
    step = 1;
    selectedLanguage: any = null;
    categories: any[] = [];
    loadingCategories = false;
    selectedCategories: any[] = [];
    languages: any[] = [];
    loadingLanguages = false;
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
            hideAuthor: [false],
            language: ['']
        });
        // Set categoryId from route params if present
        this.route.paramMap.subscribe(params => {
            this.categoryId = params.get('categoryId');
            if (this.categoryId && this.categoryId !== 'general') {
                this.form.patchValue({ categories: [this.categoryId] });
            }
        });
    }

    ngOnInit() {
        this.loadingLanguages = true;
        this.api.get('/posts/languages/').subscribe({
            next: (res: any) => {
                this.languages = Array.isArray(res) ? res : (res?.results || []);
                this.loadingLanguages = false;
            },
            error: () => {
                this.loadingLanguages = false;
            }
        });
    }

    selectLanguage(lang: any) {
        this.selectedLanguage = lang;
        this.form.patchValue({ language: lang.id });
        this.step = 2;
        this.fetchCategories(lang.isoCode);
        console.log(this.form.value)
    }

    fetchCategories(languageCode: string) {
        this.loadingCategories = true;
        this.api.get('/posts/categories/hierarchy/').subscribe({
            next: (res: any) => {
                this.categories = Array.isArray(res) ? res : (res?.results || []);
                this.loadingCategories = false;
            },
            error: () => {
                this.loadingCategories = false;
            }
        });
    }

    selectCategory(category: any) {
        const idx = this.selectedCategories.findIndex((c) => c.id === category.id);
        if (idx === -1) {
            this.selectedCategories.push(category);
        } else {
            this.selectedCategories.splice(idx, 1);
        }
        const ids = this.selectedCategories.map((c) => c.id);
        this.form.patchValue({ categories: ids });
        console.log(this.form.value)
    }

    onLanguageChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.form.patchValue({ language: select.value });
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
        console.log(this.form.value)
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
