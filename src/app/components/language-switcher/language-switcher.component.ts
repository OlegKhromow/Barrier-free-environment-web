import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-language-switcher',
  imports: [],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css'
})
export class LanguageSwitcherComponent {
  @Input() current: 'ua' | 'en' = 'ua';
  @Output() changeLanguage = new EventEmitter<'ua' | 'en'>();

  switch(lang: 'ua' | 'en') {
    if (lang !== this.current) {
      this.changeLanguage.emit(lang);
    }
  }
}
