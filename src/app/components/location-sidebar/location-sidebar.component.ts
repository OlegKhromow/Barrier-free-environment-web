import {Component, Input, Output, EventEmitter, OnChanges} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Location } from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';

@Component({
  selector: 'app-location-sidebar',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './location-sidebar.component.html',
  styleUrls: ['./location-sidebar.component.css']
})
export class LocationSidebarComponent implements OnChanges{
  @Input() location: Location | null = null;
  criteriaTree: any | null = null;

  // Новий @Input для duplicate режиму
  @Input() duplicateMode: boolean = false;
  // Повідомляємо MapPage про вибір користувача у сайдбарі
  @Output() duplicateAnswer = new EventEmitter<'yes' | 'no'>();

  constructor(private locationService: LocationService) {}

  days = [
    { key: 'monday', label: 'Понеділок' },
    { key: 'tuesday', label: 'Вівторок' },
    { key: 'wednesday', label: 'Середа' },
    { key: 'thursday', label: 'Четвер' },
    { key: 'friday', label: 'П’ятниця' },
    { key: 'saturday', label: 'Субота' },
    { key: 'sunday', label: 'Неділя' }
  ];

  /** ✅ Перевіряє, чи весь розклад порожній */
  hasNoSchedule(workingHours: any): boolean {
    if (!workingHours) return true;
    return this.days.every(d => {
      const day = workingHours[d.key];
      return !day || (!day.open && !day.close);
    });
  }

  /** ✅ Повертає текст для певного дня */
  getDaySchedule(day: string, workingHours: any): string {
    if (!workingHours || !workingHours[day]) return 'вихідний';
    const { open, close } = workingHours[day];
    if (!open && !close) return 'вихідний';
    if (open && close) return `${open} – ${close}`;
    return 'вихідний';
  }

  // обробники кнопок дублікатного питання
  confirmYes() {
    this.duplicateAnswer.emit('yes');
  }

  confirmNo() {
    this.duplicateAnswer.emit('no');
  }

  showGroup = true;
  openTypes = new Set<any>();

  toggleGroup() {
    this.showGroup = !this.showGroup;
  }

  toggleType(type: any) {
    if (this.openTypes.has(type)) {
      this.openTypes.delete(type);
    } else {
      this.openTypes.add(type);
    }
  }

  isTypeOpen(type: any) {
    return this.openTypes.has(type);
  }



  ngOnChanges() {
    if (this.location?.type?.id) {
      this.locationService.getCriteriaTreeByTypeId(this.location.type.id)
        .subscribe(tree => this.criteriaTree = tree);
    }
  }
}
