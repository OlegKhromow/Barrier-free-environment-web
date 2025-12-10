import {Component, Input, Output, EventEmitter, OnChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';
import { Router } from '@angular/router';

import {LocationInfoComponent} from '../location-info/location-info.component';
import {AuthService} from '../../core/services/security/auth.service';
import {SlideshowComponent} from '../slideshow-component/slideshow-component';
import {LocationCreateFormComponent} from '../location-create-form/location-create-form.component';
import {PendingLocationInfoComponent} from '../pending-location-info/pending-location-info.component';

@Component({
  selector: 'app-location-sidebar',
  standalone: true,
  imports: [CommonModule, LocationInfoComponent, SlideshowComponent, LocationCreateFormComponent, PendingLocationInfoComponent],
  templateUrl: './location-sidebar.component.html',
  styleUrls: ['./location-sidebar.component.css']
})
export class LocationSidebarComponent implements OnChanges{
  @Input() location: Location | null = null;
  // Новий @Input для duplicate режиму
  @Input() duplicateMode: boolean = false;
  @Input() locationPendingMap: Map<Location, any> | null = null;
  images: string[] | null = null;

  // Повідомляємо MapPage про вибір користувача у сайдбарі
  @Output() duplicateAnswer = new EventEmitter<'yes' | 'no'>();
  @Output() requestLogin = new EventEmitter<void>();

  showPendingCopyForm = false;
  criteriaTree: any | null = null;
  currentView: 'location' | 'pending' = 'location';
  pendingVersion: any | null = null;

  openPendingCopyForm(event: Event) {
    if (!this.authService.isLoggedIn()) {
      this.requestLogin.emit();
      return;
    }
    event.preventDefault();
    this.showPendingCopyForm = true;
  }

  constructor(private locationService: LocationService, private router: Router, private authService: AuthService) {}

  goToEvaluation(event: Event, locationId: string) {
    if (!this.authService.isLoggedIn()) {
      event.preventDefault();
      this.requestLogin.emit();
      return;
    }

    this.router.navigate(['/evaluate', locationId]);
  }

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
        .subscribe(tree => {
          this.criteriaTree = tree
          console.log(tree);
        });

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

      this.locationService.getLocationImages(this.location.imageServiceId).subscribe({
        next: res => {
          this.images = res;
        }
      })
    }
  }

  toggleView() {
    if (this.pendingVersion) {
      this.currentView = this.currentView === 'location' ? 'pending' : 'location';
    }
  }
}
