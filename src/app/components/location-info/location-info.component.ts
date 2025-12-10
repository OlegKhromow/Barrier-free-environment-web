import {Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {DecimalPipe, NgClass} from "@angular/common";
import {Location} from '../../core/models/location';
import {SlideshowComponent} from '../slideshow-component/slideshow-component';
import {BarrierlessCriteriaCheckService} from '../../core/services/barrierless-criteria-check.service';

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
  @Input() pendingLocation: any | undefined;
  @Input() criteriaTree: any | null = null;
  openTypes = new Set<any>();
  showCommentsMap = new Map<any, boolean>();

  preparedComments = new Map<any, any[]>();
  commentImages = new Map<string, string[]>();

  private barrierlessCriteriaCheckService = inject(BarrierlessCriteriaCheckService);

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
    if (this.pendingLocation) {
      this.location = this.pendingLocation;
    }
    this.preparedComments.clear();
    this.commentImages.clear();
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

      type.criterias.forEach((c: any) => {
        this.prepareComments(c);

        this.preparedComments.get(c)?.forEach(cm =>
          this.loadCommentImages(c, cm.imageServiceId)
        );
      });
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

  prepareComments(c: any) {
    if (!this.preparedComments.has(c)) {
      const comments = c.barrierlessCriteriaChecks.map((ch: any) => ({
        ...ch,
        comment: ch.comment?.trim()
      }))
        .filter((ch: any) => {
          const hasText = !!ch.comment; // не null і не порожній
          const hasImages = !!ch.imageServiceId; // сам ID є → потім будуть завантажені
          return hasText || hasImages;
        });
      this.preparedComments.set(c, comments);
    }
  }

  toggleComments(c: any) {
    const isOpen = this.showCommentsMap.get(c) || false;
    this.showCommentsMap.set(c, !isOpen);
  }

  isCommentsOpen(c: any): boolean {
    return this.showCommentsMap.get(c) || false;
  }

  loadCommentImages(check: any, imageServiceId: string) {
    if (!imageServiceId || this.commentImages.has(imageServiceId))
      return;

    const combinedId = `${this.location?.id}_${imageServiceId}`;

    this.barrierlessCriteriaCheckService.getCheckImages(combinedId).subscribe({
      next: res => {
        const result = Object.values(res);
        if (result.length > 0)
          this.commentImages.set(imageServiceId, Object.values(res));
        else {
          // Якщо зображень немає — видаляємо коментар з preparedComments
          const comments = this.preparedComments.get(check);

          if (comments) {
            const filtered = comments.filter(
              (cm: any) =>
                cm.imageServiceId !== imageServiceId          // або він має текст
            );

            this.preparedComments.set(check, filtered);
          }
        }
      }
    });
  }

}
