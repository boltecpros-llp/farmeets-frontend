import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserIdentityService } from '../../shared/user-identity.service';
import { ApiHelperService } from '../../shared/api-helper.service';

@Component({
  selector: 'app-update-preference',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-preference.component.html',
  styleUrls: ['./update-preference.component.scss']
})
export class UpdatePreferenceComponent {
  step = 1;
  selectedLanguage: any = null;
  selectedCategories: any[] = [];
  languages: any[] = [];
  categories: any[] = [];
  loadingLanguages = false;
  loadingCategories = false;

  constructor(
    private router: Router,
    private userIdentity: UserIdentityService,
    private api: ApiHelperService
  ) {}

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
    this.userIdentity.setUserDetails({ language: lang.id });
    this.step = 2;
    this.fetchCategories(lang.isoCode);
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
  }

  isCategorySelected(id: string): boolean {
    return this.selectedCategories.some(c => c.id === id);
  }

  skip() {
    this.router.navigate(['/']);
  }

  savePreferences() {
    this.userIdentity.setUserDetails({ categories: this.selectedCategories.map(c => c.id) });
    this.router.navigate(['/']);
  }
}
