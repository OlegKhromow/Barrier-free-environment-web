import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RejectDialogComponent} from '../reject-dialog/reject-dialog.component';
import {AlertService} from '../../core/services/alert.service';

@Component({
  selector: 'app-comparison-dialog',
  imports: [
    FormsModule,
    RejectDialogComponent
  ],
  templateUrl: './comparison-dialog.component.html',
  styleUrl: './comparison-dialog.component.css'
})
export class ComparisonDialogComponent implements OnInit {
  @Input() originalLocation!: any;
  @Input() pendingCopy!: any;
  @Input() duplicateMode = false;

  @Output() confirmed = new EventEmitter<any>();
  @Output() rejected = new EventEmitter<string>();
  @Output() canceled = new EventEmitter<void>();

  private alertService: AlertService = inject(AlertService);

  differentFields: Array<{ key: string, label: string, original: any, pending: any }> = [];

  showRejectForm = false;

  daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
  dayMap: Record<string, string> = {
    monday: 'Понеділок',
    tuesday: 'Вівторок',
    wednesday: 'Середа',
    thursday: 'Четвер',
    friday: "П'ятниця",
    saturday: 'Субота',
    sunday: 'Неділя'
  };

  ngOnInit(): void {
    this.computeDifferences();
  }

  computeDifferences() {
    const mapping: Record<string, string> = {
      name: 'Назва',
      address: 'Адреса',
      description: 'Опис',
      contacts: 'Контакти',
      workingHours: 'Графік роботи',
    };

    for (const key of Object.keys(mapping)) {
      const o = this.originalLocation[key];
      const p = this.pendingCopy[key];

      if (JSON.stringify(o) !== JSON.stringify(p) && this.pendingCopy[key]) {
        this.differentFields.push({
          key,
          label: mapping[key],
          original: o,
          pending: p
        });
      }
    }
  }

  swapField(key: string) {
    const index = this.differentFields.findIndex(el => el.key === key);
    if (index !== -1) {
      if (this.differentFields[index].pending != null) {
        this.differentFields[index].original = this.differentFields[index].pending;
        this.differentFields[index].pending = null;
      } else {
        this.differentFields[index].pending = this.differentFields[index].original;
        this.differentFields[index].original = this.originalLocation[this.differentFields[index].key];
      }
    }
  }

  applyAll() {
    for (const diff of this.differentFields) {
      this.swapField(diff.key);
    }
  }

  confirm() {
    if (this.hasAcceptedChanges()) {

      const fields = ['name', 'address', 'description', 'contacts', 'workingHours'];
      const updatedData: any = {};

      for (const key of fields) {
        const field = this.differentFields.find(el => el.key === key);
        const value = field?.original ?? this.originalLocation[key];
        if (value)
          updatedData[key] = value;
      }

      this.confirmed.emit(updatedData);

    } else {
      this.alertService.open('Немає прийнятих змін для підтвердження!')
    }
  }

  private hasAcceptedChanges(): boolean {
    for (const item of this.differentFields) {
      const originalValue = this.originalLocation[item.key];
      const currentValue = item.original;

      // Якщо значення не збігаються — зміни є
      if (JSON.stringify(originalValue) !== JSON.stringify(currentValue)) {
        return true;
      }
    }
    return false;
  }

  cancel() {
    this.canceled.emit();
  }

  openReject() {
    this.showRejectForm = true;
  }

  submitReject(reason: string) {
    if (!reason.trim()) return;
    this.rejected.emit(reason);
  }

  formatTime(day: any): string {
    if (!day || !day.open || !day.close) return 'Вихідний';
    if (day.open === '' || day.close === '') return 'Вихідний';
    return `${day.open} – ${day.close}`;
  }
}
