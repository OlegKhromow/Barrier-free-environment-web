import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FormStateService {
  private formDataKey = 'location_form_state';

  saveFormData(data: { formValue: any; selectedImages?: any[] }) {
    localStorage.setItem(this.formDataKey, JSON.stringify(data));
  }

  getFormData(): { formValue: any; selectedImages?: any[] } | null {
    const json = localStorage.getItem(this.formDataKey);
    return json ? JSON.parse(json) : null;
  }

  clearFormData() {
    localStorage.removeItem(this.formDataKey);
  }

  reset() {
    this.clearFormData();
  }
}
