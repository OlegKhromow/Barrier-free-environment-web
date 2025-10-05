import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidationErrors, AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { LocationType } from '../../core/models/location-type';
import { LocationStatusEnum } from '../../core/models/location-status-enum';
import { LocationService } from '../../core/services/location.service';
import { FormStateService } from '../../core/services/form-state.service';

@Component({
  selector: 'app-location-create-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-create-form.component.html'
})
export class LocationCreateFormComponent {
  @Input() lat!: number;
  @Input() lng!: number;
  @Output() close = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private formState = inject(FormStateService);

  days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    type: ['', Validators.required],
    description: [''],
    contacts: this.fb.group({
      phone: [''],
      email: ['', Validators.email],
      website: ['']
    }),
    workingHours: this.fb.group(
      this.days.reduce((acc, day) => {
        acc[day] = this.fb.group({
          open: [''],
          close: ['']
        });
        return acc;
      }, {} as Record<string, FormGroup>),
      { validators: [workingHoursValidator] }
    )
  });

  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypes();

  selectedImages: { file: File, preview: string }[] = [];
  showDuplicates = false;
  similarLocations: any[] = [];

  ngOnInit() {
    const saved = this.formState.getFormData();
    if (saved) {
      this.form.patchValue(saved.formValue);
      this.selectedImages = saved.selectedImages || [];
    }
  }

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.selectedImages = Array.from(input.files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
  }

  save() {
    if (this.form.invalid) {
      console.warn('Форма невалідна', this.form.errors, this.form.get('workingHours')?.errors);
      return;
    }

    const dto = {
      ...this.form.value,
      coordinates: { lat: this.lat, lng: this.lng },
      createdBy: 'c4b22cb9-85cb-4e3d-b6c0-ff70cc98b555',
      lastVerifiedAt: new Date().toISOString(),
      status: LocationStatusEnum.PENDING
    };

    this.locationService.checkDuplicates(dto).subscribe({
      next: (res) => {
        // якщо дублікати знайдені
        if (res.status === 409) {
          this.similarLocations = res.body || [];
          this.showDuplicates = true;
          this.formState.saveFormData({
            formValue: this.form.value,
            selectedImages: this.selectedImages
          });
        } else {
          this.close.emit(dto);
        }
      },
      error: (err) => {
        if (err.status === 409) {
          this.similarLocations = err.error || [];
          this.showDuplicates = true;
          this.formState.saveFormData({
            formValue: this.form.value,
            selectedImages: this.selectedImages
          });
        } else {
          console.error('Помилка перевірки дублікатів', err);
          this.close.emit(dto);
        }
      }
    });
  }

  forceSave() {
    const dto = {
      ...this.form.value,
      coordinates: { lat: this.lat, lng: this.lng },
      createdBy: 'c4b22cb9-85cb-4e3d-b6c0-ff70cc98b555',
      lastVerifiedAt: new Date().toISOString(),
      status: LocationStatusEnum.PENDING
    };
    this.locationService.createLocation(dto).subscribe(() => {
      this.formState.clearFormData();
      this.close.emit(dto);
    });
  }

  onViewDuplicate(loc: any) {
    // наприклад, відкриваємо іншу модалку або сторінку
    this.formState.saveFormData({
      formValue: this.form.value,
      selectedImages: this.selectedImages
    });
    window.open(`/locations/${loc.id}`, '_blank');
  }

  cancel() {
    this.formState.clearFormData();
    this.close.emit(null);
  }
}

/** кастомний валідатор для робочих годин */
function workingHoursValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  if (!group.controls) return null;
  for (const [day, subGroup] of Object.entries(group.controls)) {
    const open = subGroup.get('open')?.value;
    const close = subGroup.get('close')?.value;
    if ((open && !close) || (!open && close)) {
      return { workingHoursIncomplete: true };
    }
  }
  return null;
}
