import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserIdentityService } from '../../shared/user-identity.service';
import { ApiHelperService } from '../../shared/api-helper.service';

@Component({
  selector: 'app-update-preference',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './update-preference.component.html',
  styleUrls: ['./update-preference.component.scss']
})
export class UpdatePreferenceComponent {
  public LANGUAGE_MAP: { [code: string]: string } = {
    en: "English",
    bn: "বাংলা",
    gu: "ગુજરાતી",
    mr: "मराठी",
    hi: "हिंदी",
    kn: "ಕನ್ನಡ",
    ml: "മലയാളം",
    or: "ଓଡ଼ିଆ",
    pa: "ਪੰਜਾਬੀ",
    ta: "தமிழ்",
    te: "తెలుగు"
  };
  colorMap: { [code: string]: string } = {
    en: '#2B6CB0',
    bn: '#E53E3E',
    gu: '#DD6B20',
    mr: '#6B46C1',
    hi: '#C53030',
    kn: '#2F855A',
    ml: '#319795',
    or: '#D69E2E',
    pa: '#D53F8C',
    ta: '#B7791F',
    te: '#3182CE'
  };

  getColor(code: string): string {
    return this.colorMap[code] || '#777';
  }
  step = 1;
  selectedLanguages: any[] = [];
  selectedCategories: any[] = [];
  languages: any[] = [];
  categories: any[] = [];
  filteredCategories: any[] = [];
  categorySearch: string = '';
  loadingLanguages = false;
  loadingCategories = false;

  constructor(
    private router: Router,
    private userIdentity: UserIdentityService,
    private api: ApiHelperService
  ) { }

  ngOnInit() {
    // Preselect languages and categories from user details
    const user = this.userIdentity.userDetails;
    this.selectedLanguages = Array.isArray(user?.languages) ? [...user.languages] : [];
    this.selectedCategories = Array.isArray(user?.categories) ? [...user.categories] : [];
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
    const idx = this.selectedLanguages.findIndex((l) => l.id === lang.id);
    if (idx === -1) {
      this.selectedLanguages.push(lang);
    } else {
      this.selectedLanguages.splice(idx, 1);
    }
    // Do not advance step here; wait for Next button
  }

  fetchCategories() {
    this.loadingCategories = true;
    this.api.get('/posts/categories/hierarchy/').subscribe({
      next: (res: any) => {
        this.categories = Array.isArray(res) ? res : (res?.results || []);
        this.filteredCategories = [...this.categories];
        this.loadingCategories = false;
      },
      error: () => {
        this.loadingCategories = false;
      }
    });
    this.step = 2;
  }

  onCategorySearchChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.categorySearch = input.value;
    const term = this.categorySearch.trim().toLowerCase();
    if (!term) {
      this.filteredCategories = [...this.categories];
      return;
    }
    this.filteredCategories = this.categories
      .map(cat => {
        const name = cat.names?.[this.selectedLanguages[0]?.isoCode] || cat.names?.['en'] || cat.name || '';
        // Check parent match
        const parentMatch = name.toLowerCase().includes(term);
        // Check children match
        let matchedChildren = [];
        if (Array.isArray(cat.children)) {
          matchedChildren = cat.children.filter((sub: any) => {
            const subName = sub.names?.[this.selectedLanguages[0]?.isoCode] || sub.names?.['en'] || sub.name || '';
            return subName.toLowerCase().includes(term);
          });
        }
        if (parentMatch) {
          // If parent matches, include all children
          return { ...cat };
        } else if (matchedChildren.length > 0) {
          // If any children match, include parent with only matched children
          return { ...cat, children: matchedChildren };
        }
        // No match
        return null;
      })
      .filter(cat => !!cat);
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

  isLanguageSelected(id: string): boolean {
    return this.selectedLanguages.some(l => l.id === id);
  }

  skip() {
    this.router.navigate(['/']);
  }

  async savePreferences() {
    const payload = {
      languages: this.selectedLanguages.map(l => l.id),
      categories: this.selectedCategories.map(c => c.id)
    };
    this.api.post('/accounts/users/update-subscriptions/', payload).subscribe({
      next: async () => {
        // Fetch fresh user details and store
        const userId = this.userIdentity.getUserId();
        if (userId) {
          try {
            await this.userIdentity.fetchUserDetailsFromApi(userId);
          } catch { }
        }
        this.router.navigate(['/']);
      },
      error: () => {
        this.router.navigate(['/']);
      }
    });
  }
}
