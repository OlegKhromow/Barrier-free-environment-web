import {Component, Input, Output, EventEmitter, OnChanges, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';
import { Router } from '@angular/router';

import {LocationInfoComponent} from '../location-info/location-info.component';
import {AuthService} from '../../core/services/security/auth.service';
import {SlideshowComponent} from '../slideshow-component/slideshow-component';
import {LocationCreateFormComponent} from '../location-create-form/location-create-form.component';
import {v4 as uuidv4} from 'uuid';
import {AlertService} from '../../core/services/alert.service';

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
              private alertService: AlertService) {}

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
    if (res){
      this.loadingState.emit(true);

      res.imageServiceId = uuidv4();
      if (res.selectedImages && res.selectedImages.length > 0) {
        this.checkImagesValidity(res);
      } else {
        // Якщо зображень немає - створюємо локацію одразу
        this.createPendingCopyAndUploadImages(res);
      }
    }
  }

  private checkImagesValidity(dto: any) {
    const imageServiceId = dto.imageServiceId;
    let validImagesCount = 0;
    const totalImages = dto.selectedImages.length;

    dto.selectedImages.forEach((img: { file: File }) => {
      const imageId = uuidv4();

      this.locationService.imageIsValid(imageServiceId, imageId, img.file).subscribe({
        next: () => {
          validImagesCount++;

          // Якщо всі зображення перевірені і валідні
          if (validImagesCount === totalImages) {
            this.createPendingCopyAndUploadImages(dto);
          }
        },
        error: (err) => {
          const message = err?.error?.message || err?.message || 'Сталася помилка при перевірці зображення.';
          this.alertService.open(`Зображення невалідне (${img.file.name}):\n${message}`);
        }
      });
    });
  }

  private createPendingCopyAndUploadImages(dto: any) {
    // create pending copy
    this.locationService.createPendingCopy(dto.location_id, dto).subscribe({
      next: (pendingCopy) => {
        // upload images if they exist
        if (dto.selectedImages && dto.selectedImages.length > 0) {
          const imageServiceId = pendingCopy.imageServiceId;
          let uploadsCompleted = 0;
          const totalUploads = dto.selectedImages.length;

          dto.selectedImages.forEach((img: { file: File }) => {
            const imageId = uuidv4();
            this.locationService.uploadLocationImage(imageServiceId, imageId, img.file).subscribe({
              next: () => {
                uploadsCompleted++;

                // Коли всі завантаження завершені
                if (uploadsCompleted === totalUploads) {
                  this.loadingState.emit(false);
                  this.showPendingCopyForm = false;
                  this.setPendingCopy(dto);
                  this.alertService.open('Дані надіслано на перевірку');
                }
              },
              error: err => {
                this.loadingState.emit(false);
                this.showPendingCopyForm = false;
                this.alertService.open('Помилка завантаження зображення');
                console.error('Помилка завантаження зображення:', err);
              }
            });
          });

        } else {
          // Якщо зображень немає
          this.loadingState.emit(false);
          this.showPendingCopyForm = false;
          this.setPendingCopy(dto);
          this.alertService.open('Дані надіслано на перевірку');
        }
      },
      error: (err) => {
        this.loadingState.emit(false);
        const message =
          err?.error?.description ||
          err?.error?.message ||
          err?.message ||
          'Сталася невідома помилка при створенні локації.';
        this.alertService.open(`Помилка при створенні локації:\n${message}`);
      }
    });
  }

  // обробники кнопок дублікатного питання
  confirmYes() {
    if (this.location?.id) {
      this.router.navigate(['/evaluate', this.location.id]);
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
    }
  }

  toggleView() {
    if (this.pendingVersion) {
      this.currentView = this.currentView === 'location' ? 'pending' : 'location';
    }
  }
}
