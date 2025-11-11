import {Component, Input, Output, EventEmitter, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidationErrors,
  AbstractControl
} from '@angular/forms';
import {Observable} from 'rxjs';
import {LocationType} from '../../core/models/location-type';
import {LocationStatusEnum} from '../../core/models/location-status-enum';
import {LocationService} from '../../core/services/location.service';
import {FormStateService} from '../../core/services/form-state.service';
import {MatDialog} from '@angular/material/dialog';
import {DuplicatesDialogComponent} from '../duplicates-dialog/duplicates-dialog.component';
import {AuthService} from '../../core/services/security/auth.service';

@Component({
  selector: 'app-location-create-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './location-create-form.component.html'
})
export class LocationCreateFormComponent implements OnInit {
  @Input() lat!: number;
  @Input() lng!: number;
  @Output() close = new EventEmitter<any>();
  @Output() viewDuplicate = new EventEmitter<{ id: string, similar: Array<any>, dto: any }>();

  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private formState = inject(FormStateService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
        acc[day] = this.fb.group({ open: [''], close: [''] });
        return acc;
      }, {} as Record<string, FormGroup>),
      { validators: [workingHoursValidator] }
    )
  });

  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypesObservable();
  selectedImages: { file: File, preview: string }[] = [];
  isLoading = false;

  private _lastSimilar: Array<any> | null = null;
  private _lastDto: any | null = null;

  ngOnInit() {
    const saved = this.formState.getFormData();
    if (saved) {
      this.form.patchValue(saved.formValue);
      this.selectedImages = saved.selectedImages || [];
    } else {
      this.initForm();
    }
  }

  private initForm() {
    this.form = this.fb.group({
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
          acc[day] = this.fb.group({ open: [''], close: [''] });
          return acc;
        }, {} as Record<string, FormGroup>),
        { validators: [workingHoursValidator] }
      )
    });
    this.selectedImages = [];
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

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.selectedImages = Array.from(input.files).map(file => ({ file, preview: URL.createObjectURL(file) }));
  }

  save() {
    if (this.form.invalid) {
      console.warn('Форма невалідна', this.form.errors, this.form.get('workingHours')?.errors);
      return;
    }

    // Блокуємо форму та запускаємо спінер
    this.setLoadingState(true);

    const raw = this.form.value;
    const normalizedWorkingHours = this.normalizeWorkingHours(this.form.get('workingHours') as FormGroup);

    const dto = {
      ...raw,
      workingHours: normalizedWorkingHours,
      coordinates: { lat: this.lat, lng: this.lng },
      status: LocationStatusEnum.PENDING,
      selectedImages: this.selectedImages
    };

    this.locationService.checkDuplicates(dto).subscribe({
      next: (res) => {
        if (res.status === 409) {
          const similarArr = (res.body?.similar || []).map((it: any) => ({
            id: it.id,
            name: it.name,
            address: it.address,
            latitude: it.latitude,
            longitude: it.longitude
          }));
          this.openDuplicatesDialog(similarArr, dto);
        } else {
          this.close.emit(dto);
        }
        this.setLoadingState(false);
      },
      error: (err) => {
        if (err.status === 409) {
          const similarArr = (err.error?.similar || []).map((it: any) => ({
            id: it.id,
            name: it.name,
            address: it.address,
            latitude: it.latitude,
            longitude: it.longitude
          }));
          this.openDuplicatesDialog(similarArr, dto);
        } else {
          console.error('Помилка перевірки дублікатів', err);
          this.close.emit(dto);
        }
        this.setLoadingState(false);
      }
    });
  }

  private setLoadingState(loading: boolean) {
    this.isLoading = loading;
    // Блокуємо/розблоковуємо форму
    if (loading) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  private openDuplicatesDialog(similar: Array<{
    id: string,
    name: string,
    address?: string,
    likeness: number,
    latitude?: number,
    longitude?: number
  }>, dto: any) {
    this.formState.saveFormData({ formValue: this.form.value, selectedImages: this.selectedImages });
    this._lastSimilar = similar;
    this._lastDto = dto;

    const ref = this.dialog.open(DuplicatesDialogComponent, { data: { similar }, width: '600px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'proceed') {
        this.formState.clearFormData();
        this.close.emit({ ...dto, force: true });
      } else if (result.action === 'view' && result.id) {
        this.viewDuplicate.emit({ id: result.id, similar: similar, dto: dto });
      }
    });
  }

  cancel() {
    this.formState.clearFormData();
    this.initForm();
    this.close.emit(null);
  }
}

/** кастомний валідатор для робочих годин */
function workingHoursValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  if (!group.controls) return null;
  for (const [day, subGroup] of Object.entries(group.controls)) {
    const open = (subGroup as FormGroup).get('open')?.value;
    const close = (subGroup as FormGroup).get('close')?.value;
    if ((open && !close) || (!open && close)) {
      return { workingHoursIncomplete: true };
    }
  }
  return null;
}
