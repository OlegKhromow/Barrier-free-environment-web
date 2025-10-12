import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { LocationService } from '../../core/services/location.service';
import { LocationStatusEnum } from '../../core/models/location-status-enum';
import { AuthService } from '../../core/services/security/auth.service';
import { Observable } from 'rxjs';
import { LocationType } from '../../core/models/location-type';

@Component({
  selector: 'app-location-pending-copy-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-pending-copy-form.component.html'
})
export class LocationPendingCopyFormComponent implements OnInit {
  @Input() locationId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  currentUserId: string | null = null;
  form!: FormGroup;
  selectedImages: { file: File, preview: string }[] = [];
  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypes();

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  ngOnInit() {
    this.initForm();

    // ✅ підтягуємо користувача
    this.authService.getByUsername().subscribe({
      next: user => this.currentUserId = user.id,
      error: err => console.error('❌ Не вдалося отримати користувача:', err)
    });

    // ✅ підтягуємо дані локації для попереднього заповнення
    if (this.locationId) {
      this.locationService.getLocationById(this.locationId).subscribe({
        next: (loc) => {
          this.form.patchValue({
            name: loc.name,
            address: loc.address,
            description: loc.description,
            contacts: loc.contacts || {},
            workingHours: loc.workingHours || {}
          });
        },
        error: (err) => console.error('❌ Не вдалося завантажити локацію', err)
      });
    }
  }

  private initForm() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      description: [''],
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
      status: LocationStatusEnum.PENDING,
      updatedAt: new Date().toISOString()
    };

    this.locationService.createPendingCopy(this.locationId, dto).subscribe({
      next: (res) => {
        console.log('✅ Pending copy created', res);
        alert('Дані надіслано на перевірку');
        this.saved.emit(res);
      },
      error: (err) => {
        console.error('❌ Помилка при створенні pending копії', err);
        alert('Не вдалося створити копію локації.');
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
