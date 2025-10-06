import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidationErrors, AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { LocationType } from '../../core/models/location-type';
import { LocationStatusEnum } from '../../core/models/location-status-enum';
import { LocationService } from '../../core/services/location.service';
import { FormStateService } from '../../core/services/form-state.service';
import { MatDialog } from '@angular/material/dialog';
import { DuplicatesDialogComponent } from '../duplicates-dialog/duplicates-dialog.component';

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
  // Новий EventEmitter, щоб повідомити MapPage про перегляд дубліката
  @Output() viewDuplicate = new EventEmitter<{ id: string, similar: Array<any>, dto: any }>();

  private fb = inject(FormBuilder);
  private locationService = inject(LocationService);
  private formState = inject(FormStateService);
  private dialog = inject(MatDialog);

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
        acc[day] = this.fb.group({ open: [''], close: [''] });
        return acc;
      }, {} as Record<string, FormGroup>),
      { validators: [workingHoursValidator] }
    )
  });

  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypes();
  selectedImages: { file: File, preview: string }[] = [];

  // збережемо останній similar і dto, щоб MapPage / діалог міг ними оперувати
  private _lastSimilar: Array<any> | null = null;
  private _lastDto: any | null = null;

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
    this.selectedImages = Array.from(input.files).map(file => ({ file, preview: URL.createObjectURL(file) }));
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

    // перевіряємо дублікат
    this.locationService.checkDuplicates(dto).subscribe({
      next: (res) => {
        if (res.status === 409) {
          const similarArr = (res.body?.similar || []).map((it: any) => ({
            id: it.location?.id,
            name: it.location?.name,
            address: it.location?.address,
            likeness: it.likeness,
            latitude: it.location?.latitude,
            longitude: it.location?.longitude
          }));
          this.openDuplicatesDialog(similarArr, dto);
        } else {
          // ✅ просто віддаємо dto нагору
          this.close.emit(dto);
        }
      },
      error: (err) => {
        if (err.status === 409) {
          const similarArr = (err.error?.similar || []).map((it: any) => ({
            id: it.location?.id,
            name: it.location?.name,
            address: it.location?.address,
            likeness: it.likeness,
            latitude: it.location?.latitude,
            longitude: it.location?.longitude
          }));
          this.openDuplicatesDialog(similarArr, dto);
        } else {
          console.error('Помилка перевірки дублікатів', err);
          this.close.emit(dto);
        }
      }
    });
  }

  private openDuplicatesDialog(similar: Array<{id:string,name:string,address?:string,likeness:number,latitude?:number,longitude?:number}>, dto: any) {
    // зберігаємо стан форми перед відкриттям
    this.formState.saveFormData({ formValue: this.form.value, selectedImages: this.selectedImages });

    // зберігаємо локально, щоб потім мали доступ при view/no
    this._lastSimilar = similar;
    this._lastDto = dto;

    const ref = this.dialog.open(DuplicatesDialogComponent, { data: { similar }, width: '600px' });

    ref.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'proceed') {
        // ✅ користувач хоче примусово додати — не створюємо тут, а просто емітимо нагору (як у тебе було)
        this.formState.clearFormData();
        this.close.emit({ ...dto, force: true });
      } else if (result.action === 'view' && result.id) {
        // замість відкривати нову сторінку — повідомляємо MapPage щоб він зробив flyTo і зайшов у duplicateMode
        this.viewDuplicate.emit({ id: result.id, similar: similar, dto: dto });
        // не закриваємо форму — даємо користувачу можливість відповісти в сайдбарі
      }
    });
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
    const open = (subGroup as FormGroup).get('open')?.value;
    const close = (subGroup as FormGroup).get('close')?.value;
    if ((open && !close) || (!open && close)) {
      return { workingHoursIncomplete: true };
    }
  }
  return null;
}
