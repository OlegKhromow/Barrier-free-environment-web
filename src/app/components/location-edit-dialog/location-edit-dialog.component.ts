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

  form!: FormGroup;
  selectedImages: { file: File, preview: string }[] = [];
  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypesObservable();

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  ngOnInit() {
    this.locationService.loadLocationTypes();
    this.initForm();

    // ✅ Якщо передані дані — використовуємо їх
    if (this.prefillData) {
      this.applyPrefill(this.prefillData);
    }
    else if (this.locationId) {
      // fallback — якщо prefillData не передано
      this.locationService.getLocationById(this.locationId).subscribe({
        next: loc => this.applyPrefill(loc),
        error: err => console.error('❌ Не вдалося завантажити локацію', err)
      });
    }
  }

  /** Заповнює форму поточними даними */
  private applyPrefill(data: any) {
    this.form.patchValue({
      name: data.name || '',
      address: data.address || '',
      description: data.description || '',
      contacts: data.contacts || {},
      workingHours: data.workingHours || {},
      type: data.type?.id || data.type || '',
      // ✅ Підтягуємо координати (перевіряємо різні формати)
      lat: data.lat || data.latitude || data.coordinates?.lat || data.coordinates?.y || '',
      lng: data.lng || data.longitude || data.coordinates?.lng || data.coordinates?.x || ''
    });
  }

  /** Ініціалізація форми */
  private initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      // ✅ Поля для координат
      lat: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)]],
      lng: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)]],
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

  /** Завантаження зображень */
  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.selectedImages = Array.from(input.files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
  }

  /** конвертація 12h часу у 24h */
  private to24Hour(time: string): string {
    if (!time) return '';
    // <input type="time"> у більшості браузерів уже дає 24h ("23:11"), але залишимо перевірку
    const parts = time.split(':');
    if (parts.length < 2) return time;
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return time;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  /** Нормалізація робочих годин у формат 24h перед відправкою */
  private normalizeWorkingHours(hoursGroup: FormGroup): any {
    const result: any = {};
    for (const day of this.days) {
      const open = hoursGroup.get(`${day}.open`)?.value;
      const close = hoursGroup.get(`${day}.close`)?.value;
      result[day] = {
        open: this.to24Hour(open),
        close: this.to24Hour(close)
      };
    }
    return result;
  }

  /** Збереження оновлених даних */
  save() {
    if (this.form.invalid || !this.locationId) {
      console.warn('❌ Форма невалідна або немає locationId');
      return;
    }

    const raw = this.form.value;
    const normalizedWorkingHours = this.normalizeWorkingHours(this.form.get('workingHours') as FormGroup);


    const dto = {
      ...raw,
      workingHours: normalizedWorkingHours,
      coordinates: {
        lat: parseFloat(this.form.value.lat),
        lng: parseFloat(this.form.value.lng)
      },
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
