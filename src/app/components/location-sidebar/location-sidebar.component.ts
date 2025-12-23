import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Location} from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';
import {Router} from '@angular/router';

import {LocationInfoComponent} from '../location-info/location-info.component';
import {AuthService} from '../../core/services/security/auth.service';
import {SlideshowComponent} from '../slideshow-component/slideshow-component';
import {LocationCreateFormComponent} from '../location-create-form/location-create-form.component';
import {AlertService} from '../../core/services/alert.service';
import {PendingCopyFacadeService} from '../../core/services/pending-copy-facade.service';

@Component({
  selector: 'app-location-sidebar',
  standalone: true,
  imports: [CommonModule, LocationInfoComponent, SlideshowComponent, LocationCreateFormComponent],
  templateUrl: './location-sidebar.component.html',
  styleUrls: ['./location-sidebar.component.css']
})
export class LocationSidebarComponent implements OnChanges, OnInit {
  @Input() location: Location | null = null;
  // Новий @Input для duplicate режиму
  @Input() duplicateMode: boolean = false;
  @Input() duplicateLocation: any | null = null;
  @Input() locationPendingMap: Map<Location, any> | null = null;
  images: string[] | null = null;
  imagesPending: string[] | null = null;

  isAdmin: boolean = false;

  // Повідомляємо MapPage про вибір користувача у сайдбарі
  @Output() duplicateAnswer = new EventEmitter<'yes' | 'no'>();
  @Output() requestLogin = new EventEmitter<void>();
  @Output() loadingState = new EventEmitter<boolean>();

  showPendingCopyForm = false;
  criteriaTree: any | null = null;
  currentView: 'location' | 'pending' = 'location';
  pendingVersion: any | null = null;

  constructor(private locationService: LocationService,
              private router: Router,
              private authService: AuthService,
              private pendingCopyFacade: PendingCopyFacadeService,
              private alertService: AlertService) {
  }

  openPendingCopyForm(event: Event) {
    if (!this.authService.isLoggedIn()) {
      this.requestLogin.emit();
      return;
    }
    event.preventDefault();
    this.showPendingCopyForm = true;
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.authService.getAuthoritiesByUsername().subscribe({
        next: (roles) => {
          this.isAdmin = roles.includes('ADMIN');
        },
        error: () => {
          this.isAdmin = false;
        }
      });
    }
  }

  goToEvaluation(event: Event, locationId: string) {
    if (!this.authService.isLoggedIn()) {
      event.preventDefault();
      this.requestLogin.emit();
      return;
    }

    this.router.navigate(['/evaluate', locationId]);
  }

  onPendingCopySaved(res: any) {
    if (!res) return;

    this.pendingCopyFacade.createPendingCopy(res, {
      onStart: () => this.loadingState.emit(true),
      onFinish: () => {
        this.loadingState.emit(false);
        this.showPendingCopyForm = false;
      },
      onSuccess: pending => {
        this.setPendingCopy(pending);
        this.alertService.open('Дані надіслано на перевірку');
      }
    });
  }

// обробники кнопок дублікатного питання
  confirmYes() {
    if (this.location?.id) {
      this.duplicateAnswer.emit('yes');
    }
  }

  confirmNo() {
    this.duplicateAnswer.emit('no');
    this.images = null;
  }

  get displayData(): any {
    return this.currentView === 'location' ? this.location : this.pendingVersion;
  }

  private setPendingCopy(pending: any) {
    this.pendingVersion = pending;
    this.currentView = 'pending';
    console.log('pending', pending)
    this.locationService.getLocationImages(pending?.imageServiceId).subscribe({
      next: (res) => {
        this.imagesPending = res.map(item => item.value);
        console.log('зображення пендінгу', this.imagesPending);
      }
    });
  }

  ngOnChanges() {
    if (this.location) {
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
            this.setPendingCopy(pending);
            break;
          }
        }
      }

      // якщо pendingVersion є — залишаємо поточний вид location
      this.currentView = 'location';

      this.locationService.getLocationImages(this.location.imageServiceId).subscribe({
        next: res => {
          this.images = res.map(item => item.value);
        }
      })
    } else {
      this.images = null;
    }
  }

  toggleView() {
    if (this.pendingVersion) {
      this.currentView = this.currentView === 'location' ? 'pending' : 'location';
    }
  }
}
