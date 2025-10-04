import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidationErrors, AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { LocationType } from '../../core/models/location-type';
import { LocationStatusEnum } from '../../core/models/location-status-enum';
import { LocationService } from '../../core/services/location.service';

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
      { validators: [workingHoursValidator] } // ✅ кастомна перевірка
    )
  });

  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypes();

  selectedImages: { file: File, preview: string }[] = [];

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

    console.log('DTO to save:', dto);
    this.close.emit(dto);
  }

  cancel() {
    this.close.emit(null);
  }
}

/**
 * ✅ Кастомний валідатор для графіку роботи
 * Якщо open заповнене, а close — ні (або навпаки), форма невалідна.
 */
function workingHoursValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  if (!group.controls) return null;

  for (const [day, subGroup] of Object.entries(group.controls)) {
    const open = subGroup.get('open')?.value;
    const close = subGroup.get('close')?.value;

    const onlyOneFilled =
      (open && !close) || (!open && close);

    if (onlyOneFilled) {
      return { workingHoursIncomplete: true };
    }
  }

  return null;
}
