import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-ai-farmer-card',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ai-farmer-card.component.html',
  styleUrls: ['./ai-farmer-card.component.scss']
})
export class AiFarmerCardComponent {
  step = signal(1);
  form: FormGroup;
  generatedImageUrl = signal<string | null>(null);
  loading = signal(false);

  cropTypes = [
    { value: 'Banana', label: 'Banana', icon: '🍌' },
    { value: 'Wheat', label: 'Wheat', icon: '🌾' }
  ];
  outfits = [
    { value: 'maharashtrian', label: 'Traditional Maharashtrian', icon: '👳', desc: 'Cotton kurta, dhoti, pheta' }
  ];
  genders = [
    { value: 'male', label: 'Male', icon: '♂️' },
    { value: 'female', label: 'Female', icon: '♀️' }
  ];
  photoTypes = [
    { value: 'portrait', label: 'Portrait', icon: '🧑' },
    { value: 'landscape', label: 'Landscape', icon: '🌄' },
    { value: 'square', label: 'Square', icon: '⬛' },
    { value: 'full_body', label: 'Full Body', icon: '🧍' },
    { value: 'close_up', label: 'Close Up', icon: '🔍' }
  ];
  lightings = [
    { value: 'Golden Morning Sun', label: 'Golden Morning Sun', icon: '🌅' },
    { value: 'Soft Morning Light', label: 'Soft Morning Light', icon: '🌤️' },
    { value: 'Balanced Natural Daylight', label: 'Balanced Daylight', icon: '☀️' },
    { value: 'Late Afternoon Sun', label: 'Late Afternoon Sun', icon: '🌇' },
    { value: 'Golden Hour', label: 'Golden Hour', icon: '🌆' },
    { value: 'Overcast Daylight', label: 'Overcast', icon: '☁️' },
    { value: 'Diffused Cloudy Light', label: 'Diffused', icon: '🌥️' },
    { value: 'Cinematic Natural Light', label: 'Cinematic', icon: '🎬' },
    { value: 'Professional Outdoor Portrait Lighting', label: 'Pro Portrait', icon: '💡' }
  ];
  surroundings = [
    { value: 'cows', label: 'Cows', icon: '🐄' },
    { value: 'goats', label: 'Goats', icon: '🐐' },
    { value: 'hens', label: 'Hens', icon: '🐔' },
    { value: 'bullocks', label: 'Bullocks', icon: '🐂' },
    { value: 'bullock_cart', label: 'Bullock Cart', icon: '🛒' },
    { value: 'tractor', label: 'Tractor', icon: '🚜' },
    { value: 'farmer_hut', label: 'Farmer Hut', icon: '🏚️' },
    { value: 'trees', label: 'Trees', icon: '🌳' },
    { value: 'village_houses', label: 'Village Houses', icon: '🏠' }
  ];

  userPhotoPreview: string | null = null;

  // Modal preview state
  previewImageUrl = signal<string | null>(null);
  previewImageAlt = signal<string>('');

  constructor(private fb: FormBuilder, private router: Router, private http: HttpClient) {
    this.form = this.fb.group({
      userPhoto: [null, Validators.required],
      cropType: [this.cropTypes[0].value, Validators.required],
      outfit: [this.outfits[0].value, Validators.required],
      gender: [this.genders[0].value, Validators.required],
      photoType: [this.photoTypes[0].value, Validators.required],
      lighting: [this.lightings[0].value, Validators.required],
      surroundings: [[]]
    });
  }

  openPreview(url: string, alt: string) {
    this.previewImageUrl.set(url);
    this.previewImageAlt.set(alt);
    document.body.style.overflow = 'hidden';
  }

  closePreview() {
    this.previewImageUrl.set(null);
    this.previewImageAlt.set('');
    document.body.style.overflow = '';
  }

  get outfitDesc(): string {
    const val = this.form.value.outfit;
    const found = this.outfits.find((o: { value: string; desc: string }) => o.value === val);
    return found ? found.desc : '';
  }

  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ userPhoto: file });
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.userPhotoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  nextStep() {
    if (this.step() === 1 && this.form.get('userPhoto')?.valid) {
      this.step.set(2);
    }
  }

  prevStep() {
    if (this.step() === 2) {
      this.step.set(1);
    }
  }

  toggleSurrounding(value: string) {
    const arr = this.form.get('surroundings')?.value || [];
    if (arr.includes(value)) {
      this.form.patchValue({ surroundings: arr.filter((v: string) => v !== value) });
    } else {
      this.form.patchValue({ surroundings: [...arr, value] });
    }
  }

  async submit() {
    if (this.form.valid) {
      this.loading.set(true);
      const formData = new FormData();
      const values = this.form.value;
      formData.append('userPhoto', values.userPhoto);
      formData.append('cropType', values.cropType);
      formData.append('outfit', values.outfit);
      formData.append('gender', values.gender || '');
      formData.append('photoType', values.photoType || '');
      formData.append('lighting', values.lighting || '');
      formData.append('surroundings', (values.surroundings && values.surroundings.length > 0) ? values.surroundings.join(',') : '');

      let token = '';
      try {
        token = localStorage.getItem('token') || '';
      } catch {}
      const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;

      this.http.post<any>('https://app.farmeets.com/api/accounts/api/generate-avtar/', formData, { headers })
        .subscribe({
          next: (data) => {
            this.generatedImageUrl.set(data.image || null);
            this.loading.set(false);
          },
          error: () => {
            this.generatedImageUrl.set(null);
            this.loading.set(false);
          }
        });
    }
  }
  goToCreatePost() {
    if (this.generatedImageUrl()) {
      this.router.navigate(['/general/create-post'], { queryParams: { image: this.generatedImageUrl() } });
    }
  }
  async downloadGeneratedImage() {
    const url = this.generatedImageUrl();
    if (!url) return;
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'ai-farmer-portrait.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, '_blank');
    }
  }
  // End of class
}
