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

  farmTypes = [
    { value: 'Banana', label: 'Banana Farm', icon: '🍌' },
    { value: 'Wheat', label: 'Wheat Farm', icon: '🌾' },
    { value: 'Sugarcane', label: 'Sugarcane Farm', icon: '🌱' },
    { value: 'Rice', label: 'Rice Farm', icon: '🍚' },
    { value: 'Cotton', label: 'Cotton Farm', icon: '🧺' },
    { value: 'Vegetable', label: 'Vegetable Farm', icon: '🥦' },
    { value: 'Fruit', label: 'Fruit Orchard', icon: '🍎' }
  ];
  genders = [
    { value: 'male', label: 'Male', icon: '♂️' },
    { value: 'female', label: 'Female', icon: '♀️' }
  ];
  maleOutfits = [
    { value: 'maharashtrian', label: 'Traditional Maharashtrian Farmer Attire', desc: 'Cotton kurta, dhoti, saffron or white pheta (turban); earthy tones for rustic look. (Maharashtra)' },
    { value: 'sherwani', label: 'Sherwani', desc: 'Long embroidered coat-like garment over kurta and churidar; paired with stole; ideal for weddings. (North India)' },
    { value: 'kurta_pajama', label: 'Kurta Pajama', desc: 'Straight-cut kurta with pajama; cotton or silk; versatile for casual and festive wear. (Pan India)' },
    { value: 'dhoti_kurta', label: 'Dhoti Kurta', desc: 'Wrapped dhoti with kurta; common in traditional ceremonies across India. (Pan India)' },
    { value: 'pathani', label: 'Pathani Suit', desc: 'Long kurta with salwar; solid colors; regal North Indian look. (Punjab / North India)' },
    { value: 'bandhgala', label: 'Bandhgala Suit', desc: 'Closed-neck jacket with trousers; formal and elegant for receptions. (Rajasthan / North India)' },
    { value: 'jodhpuri', label: 'Jodhpuri Suit', desc: 'Structured jacket with churidar; royal ensemble in rich fabrics. (Rajasthan)' },
    { value: 'lungi_shirt', label: 'Lungi with Shirt/Kurta', desc: 'Casual traditional wear in South India; cotton fabrics for comfort. (Tamil Nadu / Kerala)' },
    { value: 'kashmiri_pheran', label: 'Kashmiri Pheran (Male)', desc: 'Loose woolen kurta with embroidery; worn in Kashmir for warmth and style. (Kashmir)' },
    { value: 'veshti_shirt', label: 'South Indian Veshti & Shirt', desc: 'White or cream dhoti (veshti) with shirt; often paired with angavastram. (Tamil Nadu / Kerala)' },
    { value: 'himachali_woolen', label: 'Himachali Woolen Attire', desc: 'Woolen kurta with churidar and colorful Himachali cap; ideal for cold regions. (Himachal Pradesh)' },
    { value: 'nagaland_tribal', label: 'Nagaland Tribal Male Attire', desc: 'Colorful shawls, bead necklaces, and traditional headgear; symbolic of tribal heritage. (Nagaland)' },
    { value: 'manipuri_traditional', label: 'Manipuri Male Traditional Dress', desc: 'Dhoti-style wrap with kurta and turban; simple and elegant. (Manipur)' },
    { value: 'bengali_dhoti', label: 'Bengali Dhoti & Kurta', desc: 'White dhoti with silk kurta; often paired with uttariya (shawl). (West Bengal)' },
    { value: 'odisha_sambalpuri', label: 'Odisha Sambalpuri Dhoti Kurta', desc: 'Handwoven ikat dhoti with kurta; rich cultural heritage. (Odisha)' },
    { value: 'mizo_traditional', label: 'Mizo Male Traditional Attire', desc: 'Puan (striped wrap cloth) with shirt; worn during cultural events. (Mizoram)' },
    { value: 'tripuri_attire', label: 'Tripuri Male Attire', desc: 'Rignai-style wrap for men with kurta; vibrant tribal patterns. (Tripura)' },
    { value: 'bhutia_dress', label: 'Bhutia Male Dress (Sikkim)', desc: 'Kho (long robe) tied at the waist with a belt; paired with silk shirt. (Sikkim)' }
  ];
  femaleOutfits = [
    { value: 'nauvari', label: 'Maharashtrian Nauvari Saree', desc: 'Nine-yard saree draped in dhoti style; paired with nath and green bangles; vibrant colors like green and red.' },
    { value: 'banarasi', label: 'Banarasi Saree', desc: 'Luxurious silk saree with gold zari work; ideal for weddings and festive occasions.' },
    { value: 'kanjeevaram', label: 'Kanjeevaram Saree', desc: 'South Indian silk saree with bold borders and contrasting colors; traditional and elegant.' },
    { value: 'lehenga', label: 'Lehenga Choli', desc: 'Flared skirt with fitted blouse and dupatta; heavily embroidered for weddings.' },
    { value: 'anarkali', label: 'Anarkali Suit', desc: 'Flowing frock-style kurta with churidar and dupatta; graceful and festive.' },
    { value: 'ghagra_choli', label: 'Ghagra Choli', desc: 'Traditional Rajasthani attire with mirror work and vibrant colors; paired with odhani.' },
    { value: 'kasavu', label: 'Kerala Kasavu Saree', desc: 'White saree with golden border; simple yet elegant for Onam and weddings.' },
    { value: 'punjabi_suit', label: 'Punjabi Suit', desc: 'Bright colors with phulkari dupatta; comfortable and stylish.' },
    { value: 'chaniya_choli', label: 'Gujarati Chaniya Choli', desc: 'Mirror work and vibrant hues; worn during Navratri and festive occasions.' },
    { value: 'mekhela_chador', label: 'Assamese Mekhela Chador', desc: 'Elegant silk attire with traditional motifs; worn during Bihu and weddings.' },
    { value: 'kashmiri_pheran_female', label: 'Kashmiri Pheran (Female)', desc: 'Woolen dress with intricate embroidery; paired with scarf for warmth.' },
    { value: 'half_saree', label: 'South Indian Half-Saree (Langa Voni)', desc: 'Three-piece attire with skirt, blouse, and dupatta; worn by young women.' },
    { value: 'himachali_traditional', label: 'Himachali Traditional Dress', desc: 'Woolen attire with colorful caps; vibrant patterns for cold regions.' },
    { value: 'nagaland_tribal_female', label: 'Nagaland Tribal Attire', desc: 'Bright shawls, beadwork, and traditional ornaments; symbolic of tribal heritage.' },
    { value: 'phanek_innaphi', label: 'Manipuri Phanek & Innaphi', desc: 'Wrap-around skirt with scarf; elegant and simple for cultural events.' },
    { value: 'bengali_tant', label: 'Bengali Tant Saree', desc: 'Lightweight cotton saree with red borders; ideal for daily wear and festivals.' },
    { value: 'odisha_sambalpuri_female', label: 'Odisha Sambalpuri Saree', desc: 'Handwoven saree with ikat patterns; rich cultural heritage.' },
    { value: 'puan', label: 'Mizo Puanchei', desc: 'Colorful handwoven wrap skirt; worn during traditional dances.' },
    { value: 'rignai_risa', label: 'Tripuri Rignai & Risa', desc: 'Traditional wrap skirt and scarf; vibrant tribal patterns.' },
    { value: 'bhutia_dress_female', label: 'Bhutia Dress (Sikkim)', desc: 'Kho (long robe) tied at the waist with a belt; paired with silk blouse.' }
  ];
  get outfits() {
    return this.form?.value?.gender === 'female' ? this.femaleOutfits : this.maleOutfits;
  }
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
      farmType: [this.farmTypes[0].value, Validators.required],
      outfit: [null, Validators.required],
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
      formData.append('farmType', values.farmType);
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
