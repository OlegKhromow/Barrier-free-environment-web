import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class ImageTempStoreService {
  private files = new Map<string, File>();

  save(file: File): string {
    const id = crypto.randomUUID();
    this.files.set(id, file);
    return id;
  }

  get(id: string): File | null {
    return this.files.get(id) ?? null;
  }

  getAll(): { id: string; file: File }[] {
    return Array.from(this.files.entries()).map(([id, file]) => ({id, file}));
  }

  remove(id: string) {
    this.files.delete(id);
  }

  clear() {
    this.files.clear();
  }

  has(): boolean {
    return this.files.size > 0;
  }
}

