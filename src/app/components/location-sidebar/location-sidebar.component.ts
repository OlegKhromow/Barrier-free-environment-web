import {Component, Input, Output, EventEmitter, OnChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';
import {RouterLink} from '@angular/router';
import { Router } from '@angular/router';

import {
  LocationPendingCopyFormComponent
} from '../../pages/location-pending-copy-form/location-pending-copy-form.component';
import {LocationInfoComponent} from '../location-info/location-info.component';

@Component({
  selector: 'app-location-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, LocationPendingCopyFormComponent, LocationInfoComponent],
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

  constructor(private locationService: LocationService, private router: Router) {}

  showPendingCopyForm = false;

  openPendingCopyForm(event: Event) {
    event.preventDefault();
    this.showPendingCopyForm = true;
  }

  @Input() locationPendingMap: Map<Location, any> | null = null;

  currentView: 'location' | 'pending' = 'location';
  pendingVersion: any | null = null;



  onPendingCopySaved(res: any) {
    this.showPendingCopyForm = false;
    console.log('✅ Pending copy saved:', res);
  }

  // обробники кнопок дублікатного питання
  confirmYes() {
    if (this.location?.id) {
      this.router.navigate(['/evaluate', this.location.id]);
    }
  }

  confirmNo() {
    this.duplicateAnswer.emit('no');
  }

  get displayData(): any {
    return this.currentView === 'location' ? this.location : this.pendingVersion;
  }

  ngOnChanges() {
    if (this.location?.id) {
      this.locationService.getCriteriaTreeByTypeId(this.location.id)
        .subscribe(tree => this.criteriaTree = tree);

      // шукаємо pending версію для цієї локації
      this.pendingVersion = null;
      if (this.locationPendingMap) {
        for (const [loc, pending] of this.locationPendingMap.entries()) {
          if (loc.id === this.location.id) {
            this.pendingVersion = pending;
            break;
          }
        }
      }

      // якщо pendingVersion є — залишаємо поточний вид location
      this.currentView = 'location';
    }
  }

  toggleView() {
    if (this.pendingVersion) {
      this.currentView = this.currentView === 'location' ? 'pending' : 'location';
    }
  }
}
