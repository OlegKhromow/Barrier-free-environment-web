import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {Observable} from 'rxjs';
import {LocationType} from '../../core/models/location-type';
import {LocationStatusEnum} from '../../core/models/location-status-enum';
import {LocationService} from '../../core/services/location.service';
import {FormStateService} from '../../core/services/form-state.service';
import {MatDialog} from '@angular/material/dialog';
import {DuplicatesDialogComponent} from '../duplicates-dialog/duplicates-dialog.component';
import {NgxMaskDirective, provideNgxMask} from 'ngx-mask';

@Component({
  selector: 'app-location-create-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgxMaskDirective],
  templateUrl: './location-create-form.component.html',
  providers: [provideNgxMask()]
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
  days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  selectedDays: { [key: string]: boolean } = {};

  form: FormGroup = new FormGroup({});

  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypesObservable();
  selectedImages: { file: File, preview: string }[] = [];
  isDragOver = false;
  isLoading = false;

  ngOnInit() {
    const saved = this.formState.getFormData();
    this.days.forEach(day => this.selectedDays[day] = true); // за замовчуванням всі виділені
    if (saved) {
      this.form.patchValue(saved.formValue);
      this.selectedImages = saved.selectedImages || [];
    } else {
      this.initForm();
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "YourAppName"
        }
      });
      const data = await response.json();
      const addr = data.address;

      if (!addr) return null;

      // Формуємо масив частин, додаємо тільки ті, що існують
      const parts: string[] = [];

      if (addr.city) parts.push(`м. ${addr.city}`);
      else if (addr.town) parts.push(`м. ${addr.town}`);
      else if (addr.village) parts.push(`с. ${addr.village}`);

      if (addr.road) parts.push(addr.road);
      if (addr.house_number) parts.push(addr.house_number);

      // Якщо нічого немає — повертаємо null
      if (parts.length === 0) return null;

      return parts.join(', ');
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }


  private async initForm() {
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
          acc[day] = this.fb.group({open: [''], close: ['']});
          return acc;
        }, {} as Record<string, FormGroup>),
        {validators: [workingHoursValidator]}
      ),
      quickTime: this.fb.group({
        open: [''],
        close: ['']
      }, {validators: [this.quickTimeValidator]}),
      selectedDays: this.fb.group(
        this.days.reduce((acc, day) => {
          acc[day] = [false]; // за замовчуванням всі дні виділені
          return acc;
        }, {} as Record<string, any>)
      )
    });

    this.selectedImages = [];
    await this.setAddress();
  }

  private async setAddress() {
    const address = await this.reverseGeocode(this.lat, this.lng);
    if (address) {
      this.form.patchValue({ address });
    }
  }


  isFormInvalid(): boolean {
    // Валідність форми без quickTime
    const {quickTime, ...rest} = this.form.controls;
    return Object.values(rest).some(ctrl => ctrl.invalid);
  }


  get workingHoursForm(): FormGroup {
    return this.form.get('workingHours') as FormGroup;
  }

  getSelectedDayControl(day: string): FormControl {
    return this.form.get(`selectedDays.${day}`) as FormControl;
  }

  // Валідатор для швидкого часу
  quickTimeValidator(group: FormGroup) {
    const open = group.get('open')?.value;
    const close = group.get('close')?.value;
    if (!open || !close) return {incomplete: true};
    if (close <= open) return {invalidRange: true};
    return null;
  }

// Геттер для швидкого часу
  get quickTimeForm(): FormGroup {
    return this.form.get('quickTime') as FormGroup;
  }

// Перевірка валідності швидкого часу (для кнопки та повідомлення)
  isQuickTimeInvalid(): boolean {
    const group = this.quickTimeForm;
    return group.invalid || !group.value.open || !group.value.close;
  }

// Застосування часу до обраних днів
  applyQuickTime() {
    if (this.isQuickTimeInvalid()) return;

    const quickTime = this.quickTimeForm.value;
    this.days.forEach(day => {
      const isSelected = this.form.get(`selectedDays.${day}`)?.value;
      if (isSelected) {
        const fg = this.form.get(`workingHours.${day}`) as FormGroup;
        fg.patchValue({open: quickTime.open, close: quickTime.close});
      }
    });
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

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      this.handleFiles(files);
    }
  }

  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.handleFiles(files);
    }
  }

// Функція для обробки файлів
  handleFiles(files: File[]) {
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return; // пропускаємо не картинки
      this.selectedImages.push({file, preview: URL.createObjectURL(file)})
    });
  }

  removeImage(index: number) {
    this.selectedImages.splice(index, 1);
  }


  save() {
    if (this.isFormInvalid()) {
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
      coordinates: {lat: this.lat, lng: this.lng},
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
    this.formState.saveFormData({formValue: this.form.value, selectedImages: this.selectedImages});

    const ref = this.dialog.open(DuplicatesDialogComponent, {data: {similar}, width: '600px'});
    ref.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'proceed') {
        this.formState.clearFormData();
        this.close.emit({...dto, force: true});
      } else if (result.action === 'view' && result.id) {
        this.viewDuplicate.emit({id: result.id, similar: similar, dto: dto});
      }
    });
  }

  cancel() {
    this.formState.clearFormData();
    this.initForm();
    this.close.emit(null);
  }

  closeDialog(event: MouseEvent | null){
    if (event?.target === event?.currentTarget)
      this.cancel()
  }
}

/** кастомний валідатор для робочих годин */
function workingHoursValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  if (!group.controls) return null;
  for (const [, subGroup] of Object.entries(group.controls)) {
    const open = parseInt((subGroup as FormGroup).get('open')?.value);
    const close = parseInt((subGroup as FormGroup).get('close')?.value);
    if ((open && !close) || (!open && close) || open >= close) {
      return {workingHoursIncomplete: true};
    }
  }
  return null;
}
