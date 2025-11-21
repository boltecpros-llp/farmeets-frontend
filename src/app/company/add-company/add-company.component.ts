import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiHelperService } from '../../shared/api-helper.service';

@Component({
  selector: 'app-add-company',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-company.component.html',
  styleUrls: ['./add-company.component.scss']
})
export class AddCompanyComponent {
  form: FormGroup;
  uploadingLogo = false;
  logoPreview: string = '';
  constructor(private fb: FormBuilder, private api: ApiHelperService, private router: Router) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      logo: [''],
      companyType: ['FPO', Validators.required],
      category_ids: [[], Validators.required],
      language_ids: [[], Validators.required],
      images: [[]],
      videos: [[]]
    });
  }

  onLogoChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.uploadingLogo = true;
    // Implement logo upload logic here
    // After upload, set this.logoPreview and patch logo url to form
    this.uploadingLogo = false;
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
