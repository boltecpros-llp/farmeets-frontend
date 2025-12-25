import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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
    { value: 'tractor', label: 'Tractor', icon: '🚜' },
    { value: 'farmer_hut', label: 'Farmer Hut', icon: '🏚️' },
    { value: 'trees', label: 'Trees', icon: '🌳' },
    { value: 'village_houses', label: 'Village Houses', icon: '🏠' }
  ];

  userPhotoPreview: string | null = null;

  constructor(private fb: FormBuilder, private router: Router) {
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
    // return this.generatedImageUrl.set("https://farmeets.s3.ap-south-1.amazonaws.com/user_ff4ff569-9074-4a6f-8388-1f72b515be68/posts/67d58ead-8bf1-453f-9a48-e630ec0941ca_avatar_1dfb9bac764d4f07a55ac869bb75e2f8.png");
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

      try {
        const response = await fetch('https://app.farmeets.com/api/accounts/api/generate-avtar/', {
          method: 'POST',
          body: formData
        });
        if (!response.ok) throw new Error('Failed to generate image');
        const data = await response.json();
        // Assuming the API returns { imageUrl: string }
        this.generatedImageUrl.set(data.image || null);
      } catch (err) {
        this.generatedImageUrl.set(null);
        // Optionally handle error (e.g., show toast)
      } finally {
        this.loading.set(false);
      }
    }
  }
  goToCreatePost() {
    if (this.generatedImageUrl()) {
      this.router.navigate(['/general/create-post'], { queryParams: { image: this.generatedImageUrl() } });
    }
  }
  // End of class
}
