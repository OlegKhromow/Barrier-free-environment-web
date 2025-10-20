import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { LocationService } from '../../core/services/location.service';
import { LocationStatusEnum } from '../../core/models/location-status-enum';
import { AuthService } from '../../core/services/security/auth.service';
import { Observable } from 'rxjs';
import { LocationType } from '../../core/models/location-type';

@Component({
  selector: 'app-location-edit-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-edit-dialog.component.html'
})
export class LocationEditDialogComponent implements OnInit {
  @Input() locationId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();
  @Input() prefillData: any | null = null;


  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  readonly statuses = [
    { value: LocationStatusEnum.PENDING, label: 'Очікує перевірки' },
    { value: LocationStatusEnum.PUBLISHED, label: 'Опубліковано' },
    { value: LocationStatusEnum.REJECTED, label: 'Відхилено' }
  ];


  currentUserId: string | null = null;
  form!: FormGroup;
  selectedImages: { file: File, preview: string }[] = [];
  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypesObservable();

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  ngOnInit() {
    this.locationService.loadLocationTypes();
    this.initForm();


    // ✅ підтягуємо користувача
    this.authService.getByUsername().subscribe({
      next: user => this.currentUserId = user.id,
      error: err => console.error('❌ Не вдалося отримати користувача:', err)
    });

    // ✅ якщо передали дані для попереднього заповнення — використовуємо їх
    if (this.prefillData) {
      this.applyPrefill(this.prefillData);
    }
    else if (this.locationId) {
      // fallback — якщо не передали prefillData
      this.locationService.getLocationById(this.locationId).subscribe({
        next: loc => this.applyPrefill(loc),
        error: err => console.error('❌ Не вдалося завантажити локацію', err)
      });
    }
  }

  private applyPrefill(data: any) {
    this.form.patchValue({
      name: data.name || '',
      address: data.address || '',
      description: data.description || '',
      contacts: data.contacts || {},
      workingHours: data.workingHours || {},
      type: data.type?.id || data.type || '',
      // ✅ додаємо статус
      status: data.status || LocationStatusEnum.PENDING
    });
  }



  private initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      // ✅ додаємо статус
      status: ['', Validators.required],
      contacts: this.fb.group({
        phone: [''],
        email: ['', Validators.email],
        website: ['']
      }),
      workingHours: this.fb.group(
        this.days.reduce((acc, day) => {
          acc[day] = this.fb.group({ open: [''], close: [''] });
          return acc;
        }, {} as Record<string, FormGroup>),
        { validators: [workingHoursValidator] }
      )
    });
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
    if (this.form.invalid || !this.locationId) {
      console.warn('❌ Форма невалідна або немає locationId');
      return;
    }

    const dto = {
      ...this.form.value,
      organizationId: null,
      updatedAt: new Date().toISOString()
    };

    this.locationService.updateLocation(this.locationId, dto).subscribe({
      next: (res) => {
        console.log('✅ Update performed', res);
        alert('Локація оновлена');
        this.saved.emit(res);
      },
      error: (err) => {
        console.error('❌ Помилка при оновленні', err);
        alert('Не вдалося оновити локацію.');
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}

/** кастомний валідатор робочих годин */
function workingHoursValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  for (const [_, subGroup] of Object.entries(group.controls)) {
    const open = (subGroup as FormGroup).get('open')?.value;
    const close = (subGroup as FormGroup).get('close')?.value;
    if ((open && !close) || (!open && close)) {
      return { workingHoursIncomplete: true };
    }
  }
  return null;
}
