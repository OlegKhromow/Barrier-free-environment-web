import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LocationStatusEnum } from '../../core/models/location-status-enum';
import { LocationService } from '../../core/services/location.service';
import { Observable } from 'rxjs';
import { LocationType } from '../../core/models/location-type';

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

  // форма з блоком contacts
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    type: ['', Validators.required], // UUID вибраного LocationType
    description: [''],
    contacts: this.fb.group({
      phone: [null],
      email: [null, Validators.email],
      website: [null]
    })
  });

  locationTypes$: Observable<LocationType[]> = this.locationService.getLocationTypes();

  save() {
    if (!this.form.valid) return;

    const dto = {
      ...this.form.value,
      coordinates: { lat: this.lat, lng: this.lng },
      createdBy: 'c4b22cb9-85cb-4e3d-b6c0-ff70cc98b555',
      lastVerifiedAt: new Date().toISOString(),
      status: LocationStatusEnum.PENDING
    };

    this.close.emit(dto);
  }

  cancel() {
    this.close.emit(null);
  }
}
