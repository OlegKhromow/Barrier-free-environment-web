import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LocationService } from '../../core/services/location.service';
import { Location } from '../../core/models/location';
import { LocationPendingCopyFormComponent } from '../location-pending-copy-form/location-pending-copy-form.component';

@Component({
  selector: 'app-location-detail-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink, LocationPendingCopyFormComponent],
  templateUrl: './location-detail-page.component.html',
  styleUrls: ['./location-detail-page.component.css']
})
export class LocationDetailPage implements OnInit {
  location: Location | null = null;
  criteriaTree: any | null = null;
  locationPendingMap: Map<Location, any> | null = null;

  duplicateMode = false;
  showPendingCopyForm = false;

  currentView: 'location' | 'pending' = 'location';
  pendingVersion: any | null = null;

  days = [
    { key: 'monday', label: 'Понеділок' },
    { key: 'tuesday', label: 'Вівторок' },
    { key: 'wednesday', label: 'Середа' },
    { key: 'thursday', label: 'Четвер' },
    { key: 'friday', label: 'П’ятниця' },
    { key: 'saturday', label: 'Субота' },
    { key: 'sunday', label: 'Неділя' }
  ];

  showGroup = true;
  openTypes = new Set<any>();
  showCommentsMap = new Map<any, boolean>();

  constructor(
    private route: ActivatedRoute,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.locationService.getLocationById(id).subscribe(loc => {
        this.location = loc;
        this.loadCriteriaTree();
        this.findPendingVersion();
      });
    }
  }

  loadCriteriaTree() {
    if (this.location?.id) {
      this.locationService.getCriteriaTreeByTypeId(this.location.id)
        .subscribe(tree => this.criteriaTree = tree);
    }
  }

  findPendingVersion() {
    this.pendingVersion = null;
    if (this.location && this.locationPendingMap) {
      for (const [loc, pending] of this.locationPendingMap.entries()) {
        if (loc.id === this.location.id) {
          this.pendingVersion = pending;
          break;
        }
      }
    }
  }

  openPendingCopyForm(event: Event) {
    event.preventDefault();
    this.showPendingCopyForm = true;
  }

  onPendingCopySaved(res: any) {
    this.showPendingCopyForm = false;
    console.log('✅ Pending copy saved:', res);
  }

  confirmYes() {
    this.duplicateMode = false;
  }

  confirmNo() {
    this.duplicateMode = false;
  }

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

  getBalancePosition(c: any): number {
    const total = c.barrierlessCriteriaChecks?.length || 0;
    if (total === 0) return 50;
    const hasIssue = this.countChecks(c, true);
    return (hasIssue / total) * 100;
  }

  hasNoSchedule(workingHours: any): boolean {
    if (!workingHours) return true;
    return this.days.every(d => {
      const day = workingHours[d.key];
      return !day || (!day.open && !day.close);
    });
  }

  getDaySchedule(day: string, workingHours: any): string {
    if (!workingHours || !workingHours[day]) return 'вихідний';
    const { open, close } = workingHours[day];
    if (!open && !close) return 'вихідний';
    if (open && close) return `${open} – ${close}`;
    return 'вихідний';
  }

  getAccessibilityLevel(score: number | null | undefined): string {
    if (score == null) return 'Немає даних';
    if (score === 100) return 'Повна безбар’єрність';
    if (score >= 70) return 'Висока безбар’єрність';
    if (score >= 50) return 'Середня безбар’єрність';
    if (score >= 30) return 'Низька безбар’єрність';
    return 'Недоступна';
  }
}
