import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-slideshow-component',
  imports: [
    NgClass
  ],
  templateUrl: './slideshow-component.html',
  styleUrl: './slideshow-component.css'
})
export class SlideshowComponent implements OnChanges {

  @Input() compactMode = false;

  @Input() images: string[] | null = null;
  selectedImage: string | null = null;
  fullScreenImage: string | null = null;
  isZoomed = false;

  private slideInterval!: any;
  private slideIndex = 0;
  readonly slideDelay = 4000;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['images'] && this.images && this.images.length > 0) {
      this.slideIndex = 0;
      this.selectedImage = this.images[0];
      if (!this.compactMode) {
        this.startSlideshow();
      }
    }
  }

  startSlideshow() {
    if (this.compactMode) return;

    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }

    this.slideInterval = setInterval(() => {
      // якщо обрали вручну — переходить далі у списку
      if (this.images) {
        this.slideIndex = (this.slideIndex + 1) % this.images.length;
        this.selectedImage = this.images[this.slideIndex];
      }
    }, this.slideDelay);
  }

  onSelect(img: string) {
    this.selectedImage = img;
    if (this.images)
      this.slideIndex = this.images.indexOf(img); // синхронізуємо індекс

    if (this.compactMode) {
      this.fullScreenImage = img;
    }
  }

  toggleZoom(event: MouseEvent) {
    event.stopPropagation(); // щоб не закрило модалку
    this.isZoomed = !this.isZoomed;
  }

  closeFullScreen(event: MouseEvent) {
    // якщо клік по фону — закриваємо
    this.fullScreenImage = null;
    this.isZoomed = false;
  }
}
