import { Component } from '@angular/core';

// Your language object (ISO code -> native-language name)
const LANGUAGE_MAP: { [code: string]: string } = {
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

@Component({
  selector: 'app-languages',
  standalone: true,
  templateUrl: './languages.component.html',
  styleUrls: ['./languages.component.scss']
})
export class LanguagesComponent {
  // Convert map to array for *ngFor iteration
  languages = Object.keys(LANGUAGE_MAP).map(code => ({
    code,
    name: LANGUAGE_MAP[code]
  }));

  // Optional color map — change colors as you like
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
}
