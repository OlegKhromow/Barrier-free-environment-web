import {Component, OnInit, Renderer2} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-accessibility-toolbar',
  imports: [
    NgClass
  ],
  templateUrl: './accessibility-toolbar.component.html',
  styleUrl: './accessibility-toolbar.component.css'
})
export class AccessibilityToolbarComponent implements OnInit {

  isOpen = false;
  currentScale = 1;
  isGrayscale = false;

  constructor(private renderer: Renderer2) {}

  ngOnInit() {
    // Відновлюємо стан з localStorage
    const savedScale = localStorage.getItem('accessibility-scale');
    const savedGrayscale = localStorage.getItem('accessibility-grayscale');

    if (savedScale) {
      this.currentScale = parseFloat(savedScale);
      this.applyScale();
    }

    if (savedGrayscale === 'true') {
      this.isGrayscale = true;
      this.applyGrayscale();
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  increaseFont() {
    this.currentScale += 0.1;
    this.applyScale();
  }

  decreaseFont() {
    this.currentScale = Math.max(0.6, this.currentScale - 0.1);
    this.applyScale();
  }

  reset() {
    this.currentScale = 1;
    this.isGrayscale = false;

    this.applyScale();
    this.renderer.removeClass(document.body, 'grayscale');

    localStorage.removeItem('accessibility-scale');
    localStorage.removeItem('accessibility-grayscale');
  }

  toggleGrayscale() {
    this.isGrayscale = !this.isGrayscale;
    this.applyGrayscale();

    // Зберігаємо вибір
    localStorage.setItem('accessibility-grayscale', this.isGrayscale.toString());
  }

  private applyGrayscale() {
    if (this.isGrayscale) {
      this.renderer.addClass(document.body, 'grayscale');
    } else {
      this.renderer.removeClass(document.body, 'grayscale');
    }
  }

  private applyScale() {
    document.documentElement.style.fontSize = `${this.currentScale}em`;
  }
}
