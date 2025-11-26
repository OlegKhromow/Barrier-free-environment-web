import {Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DecimalPipe, NgClass} from "@angular/common";
import {Location} from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';
import {SlideshowComponent} from '../slideshow-component/slideshow-component';

@Component({
  selector: 'app-location-info',
  imports: [
    DecimalPipe,
    NgClass,
    SlideshowComponent
  ],
  templateUrl: './location-info.component.html',
  styleUrl: './location-info.component.css',
})
export class LocationInfoComponent implements OnChanges {
  @Input() location: Location | undefined;
  @Input() criteriaTree: any | null = null;
  openTypes = new Set<any>();
  showCommentsMap = new Map<any, boolean>();
  images: string[] | null = null;

  private locationService = inject(LocationService);

  days = [
    {key: 'monday', label: 'ПН'},
    {key: 'tuesday', label: 'ВТ'},
    {key: 'wednesday', label: 'СР'},
    {key: 'thursday', label: 'ЧТ'},
    {key: 'friday', label: 'ПТ'},
    {key: 'saturday', label: 'СБ'},
    {key: 'sunday', label: 'НД'}
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (this.location) {
      // upload images for location
      this.locationService.getLocationImages(this.location.imageServiceId).subscribe({
        next: res => {
          this.images = res;
        }
      })
    }
  }

  // Повертає групи днів за однаковим розкладом
  getGroupedSchedule(workingHours: any) {
    const groups: { days: string[], schedule: string }[] = [];

    for (const d of this.days) {
      const schedule = this.getDaySchedule(d.key, workingHours);

      // Якщо уже є група з таким же розкладом, додаємо день у неї
      const existing = groups.find(g => g.schedule === schedule);

      if (existing) {
        existing.days.push(d.label);
      } else {
        groups.push({
          days: [d.label],
          schedule
        });
      }
    }

    return groups;
  }

  // Об’єднує робочі дні у формат ПН–СР
  formatDaysGroup(days: string[]) {
    if (days.length === 1) return days[0];
    return `${days[0]}–${days[days.length - 1]}`;
  }


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
    const {open, close} = workingHours[day];
    if (!open && !close) return 'вихідний';
    if (open && close) return `${open} – ${close}`;
    return 'вихідний';
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

  getBalancePosition(c: any): number {
    const total = c.barrierlessCriteriaChecks?.length || 0;
    if (total === 0) return 50; // по центру, якщо немає голосів

    const hasIssue = this.countChecks(c, true);

    // Баланс: 0 = повністю зелений, 100 = повністю червоний
    return (hasIssue / total) * 100;
  }

  getAccessibilityLevel(score: number | null | undefined): string {
    if (score == null) return 'Немає даних';
    if (score === 100) return 'Повна безбар’єрність';
    if (score >= 70) return 'Висока безбар’єрність';
    if (score >= 50) return 'Середня безбар’єрність';
    if (score >= 30) return 'Низька безбар’єрність';
    return 'Недоступна';
  }

  getAccessibilityColor(score: number | null | undefined): string {
    if (score == null) return 'text-gray-500';
    if (score === 100) return 'text-green-700';
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  }

  countChecks(c: any, hasIssue: boolean): number {
    return c.barrierlessCriteriaChecks?.filter((ch: any) => ch.hasIssue === hasIssue).length || 0;
  }

  getComments(c: any): string[] {
    return c.barrierlessCriteriaChecks
      ?.map((ch: any) => ch.comment)
      .filter((comment: string) => !!comment?.trim()) || [];
  }

  toggleComments(c: any) {
    const isOpen = this.showCommentsMap.get(c) || false;
    this.showCommentsMap.set(c, !isOpen);
  }

  isCommentsOpen(c: any): boolean {
    return this.showCommentsMap.get(c) || false;
  }
}
