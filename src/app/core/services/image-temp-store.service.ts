import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageTempStoreService {
  private files: File[] = [];

  set(files: File[]) {
    this.files = files;
  }

  get(): File[] {
    return this.files;
  }

  clear() {
    this.files = [];
  }

  has(): boolean {
    return this.files.length > 0;
  }
}
