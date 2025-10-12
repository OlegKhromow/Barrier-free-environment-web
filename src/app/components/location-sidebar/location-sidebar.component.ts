import {Component, Input, Output, EventEmitter, OnChanges} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Location } from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';
import {RouterLink} from '@angular/router';
import {
  LocationPendingCopyFormComponent
} from '../../pages/location-pending-copy-form/location-pending-copy-form.component';

@Component({
  selector: 'app-location-sidebar',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink, LocationPendingCopyFormComponent],
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

  showPendingCopyForm = false;

  openPendingCopyForm(event: Event) {
    event.preventDefault();
    this.showPendingCopyForm = true;
  }

  onPendingCopySaved(res: any) {
    this.showPendingCopyForm = false;
    console.log('✅ Pending copy saved:', res);
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

  getBarrierlessRatio(c: any): number {
    const total = c.barrierlessCriteriaChecks?.length || 0;
    const noIssue = this.countChecks(c, false);
    return total > 0 ? (noIssue / total) * 100 : 0;
  }

  getBalancePosition(c: any): number {
    const total = c.barrierlessCriteriaChecks?.length || 0;
    if (total === 0) return 50; // по центру, якщо немає голосів

    const noIssue = this.countChecks(c, false);
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


  ngOnChanges() {
    if (this.location?.id) {
      this.locationService.getCriteriaTreeByTypeId(this.location.id)
        .subscribe(tree => this.criteriaTree = tree);
    }
  }

  showCommentsMap = new Map<any, boolean>();

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
