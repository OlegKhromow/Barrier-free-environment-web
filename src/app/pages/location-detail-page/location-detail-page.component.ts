import {AfterViewInit, Component, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {LocationService} from '../../core/services/location.service';
import {Location} from '../../core/models/location';
import * as L from 'leaflet';
import {LocationInfoComponent} from '../../components/location-info/location-info.component';
import {SlideshowComponent} from '../../components/slideshow-component/slideshow-component';
import {LocationEditDialogComponent} from '../../components/location-edit-dialog/location-edit-dialog.component';
import {AlertService} from '../../core/services/alert.service';
import {RejectDialogComponent} from '../../components/reject-dialog/reject-dialog.component';
import {ComparisonDialogComponent} from '../../components/comparison-dialog/comparison-dialog.component';

@Component({
  selector: 'app-location-detail-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, LocationInfoComponent, SlideshowComponent, LocationEditDialogComponent, RejectDialogComponent, ComparisonDialogComponent],
  templateUrl: './location-detail-page.component.html',
  styleUrls: ['./location-detail-page.component.css']
})
export class LocationDetailPageComponent implements OnInit, AfterViewInit {
  location: Location | null = null;
  images: string[] | null = null;
  pendingLocations: any[] = [];
  criteriaTree: any | null = null;
  rejectionReason = '';

  private map!: L.Map;

  mode!: 'user' | 'admin';
  showUpdateForm = false;
  showRejectForm = false;
  showComparisonForm = false;
  showDuplicateForm = false;
  dublicateLocation: Location | null = null;

  constructor(
    private route: ActivatedRoute,
    private locationService: LocationService,
    private alertService: AlertService,
    protected router: Router
  ) {
  }


  ngOnInit() {
    if (this.router.url.includes('/locations/')) {
      this.mode = 'admin';
    } else {
      this.mode = 'user';
    }
    const id = String(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.locationService.getLocationById(id).subscribe(loc => {
        this.location = loc;
        console.log('Location object:', loc);

        this.loadCriteriaTree();
        this.loadPendingLocations();
        this.locationService.getLocationImages(this.location.imageServiceId).subscribe({
          next: res => {
            this.images = res;
          }
        })

        // ✅ Викликати checkDuplicates лише якщо статус pending або rejected
        if (loc.status === 'pending' || loc.status === 'rejected') {
          this.checkDuplicates();
        }
      });
    }
  }

  viewLocation(id: number) {
    // Повне оновлення сторінки
    window.location.href = `/user-location/${id}`;
  }

  ngAfterViewInit(): void {
    const id = String(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.locationService.getLocationById(id).subscribe(loc => {
        this.location = loc;

        setTimeout(() => {
          this.initMap();
          this.addMarker();

          const params = new URLSearchParams(window.location.search);
          const flyToLat = params.get('flyToLat');
          const flyToLng = params.get('flyToLng');
          if (flyToLat && flyToLng) {
            const lat = parseFloat(flyToLat);
            const lng = parseFloat(flyToLng);
            this.map.flyTo([lat, lng], 17, {animate: true, duration: 0.9});
          }
        });
      });
    }
  }

  selectedPending: any = null;

  openPendingModal(pending: any) {
    this.showComparisonForm = this.mode === 'admin' && pending.status === 'pending';
    this.selectedPending = pending;
  }

  closePendingModal() {
    this.selectedPending = null;
  }


  private initMap(): void {
    if (!this.location) return;

    this.map = L.map('map', {
      center: [this.location.latitude, this.location.longitude],
      zoom: 15,
      dragging: false,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.getContainer().style.cursor = 'pointer';
    this.map.on('click', () => {
      if (!this.location) return;
      this.router.navigate(['/'], {
        queryParams: {
          flyToLat: this.location.latitude,
          flyToLng: this.location.longitude,
          selectedId: this.location.id
        }
      });
    });
  }

  private async addMarker() {
    if (this.location) {
      const typeName = this.location.type.name;
      const customUrl = typeName ? `assets/map-markers/light/${typeName}.png` : null;
      let iconUrl = 'assets/map-markers/default-marker.png';

      // Перевіряємо існування кастомної іконки
      if (customUrl && await this.checkIconExists(customUrl)) {
        iconUrl = customUrl;
      }

      const icon = this.createMarkerIcon(iconUrl, [35, 40]);
      L.marker([this.location.latitude, this.location.longitude], {icon, interactive: false}).addTo(this.map);
    }
  }

  private checkIconExists(url: string): Promise<boolean> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  private createMarkerIcon(iconUrl: string, size: [number, number]): L.Icon {
    return new L.Icon({iconUrl, iconSize: size as any});
  }

  loadCriteriaTree() {
    if (this.location?.id) {
      this.locationService.getCriteriaTreeByTypeId(this.location.id)
        .subscribe(tree => this.criteriaTree = tree);
    }
  }

  loadPendingLocations() {
    if (this.location?.id) {
      if (this.mode === 'user') {
        this.locationService.getUserPendingLocationsByLocationId(this.location.id)
          .subscribe(data => {
            this.pendingLocations = data;
          });
      } else {
        this.locationService.getPendingLocationsByLocationId(this.location.id)
          .subscribe(data => {
            this.pendingLocations = data;
          });
      }
    }
  }

  similarLocations: any[] = [];
  showDuplicates = false;

  checkDuplicates() {
    if (!this.location) return;

    this.locationService.checkDuplicatesById(this.location.id).subscribe({
      next: (res) => {
        const body = res.body || res;
        if (body.message === 'No duplicates found') {
          this.showDuplicates = false;
        } else if (body.similar?.length) {
          this.similarLocations = body.similar;
          this.showDuplicates = true;
        }
      },
      error: (err) => {
        if (err.error?.similar?.length) {
          this.similarLocations = err.error.similar;
          this.showDuplicates = true;
        } else {
          console.error('❌ Помилка при перевірці дублікатів:', err);
          alert('Не вдалося завантажити список дублікатів');
        }
      }
    });
  }

  //////////ADMIN//////////

  openUpdateForm(event: Event) {
    event.preventDefault();
    this.showUpdateForm = true;
  }

  onUpdateSubmitted(res: any) {
    this.showUpdateForm = false;
  }

  changeStatus(newStatus: string, rejectionReason?: string) {
    if (!this.location) return;
    const id = this.location.id;

    const body = rejectionReason ? {rejectionReason} : {};

    this.locationService.changeStatus(id, newStatus, body).subscribe({
      next: () => {
        this.alertService.open(`Статус змінено на ${newStatus}`);
        this.locationService.getLocationById(id).subscribe(loc => this.location = loc);
      },
      error: err => {
        console.error('Помилка при зміні статусу:', err);
        this.alertService.open('Не вдалося змінити статус');
      }
    });
  }

  openRejectForm() {
    this.showRejectForm = true;
  }

  rejectionSubmit(reason: string) {
    this.changeStatus('rejected', reason);
    this.showRejectForm = false;
  }

  rejectionCancel() {
    this.showRejectForm = false;
  }


  deleteLocation() {
    if (!this.location) return;
    const id = this.location.id;
    // todo create custom confirm
    if (!confirm('Ви впевнені, що хочете видалити локацію?')) return;
    this.locationService.deleteLocation(id).subscribe({
      next: () => {
        this.alertService.open('Локацію видалено');
        this.router.navigate(['/admin/locations']);
      },
      error: err => {
        console.error('Помилка видалення', err);
        this.alertService.open('Не вдалося видалити локацію');
      }
    });
  }

  deletePending(pendingId: number) {
    if (!confirm('Ви впевнені, що хочете видалити це оновлення?')) return;

    this.locationService.deletePending(pendingId).subscribe({
      next: () => {
        this.alertService.open('Оновлення видалено');
        this.closePendingModal()
        this.loadPendingLocations();
      },
      error: err => {
        console.error('Помилка при видаленні оновлення:', err);
        this.alertService.open('Не вдалося видалити оновлення');
      }
    });
  }

  get modalLocation() {
    return {...this.location};
  }

  closeModal() {
    this.showComparisonForm = false;
    this.selectedPending = null;
  }

  confirmChanges(update: any) {
    if (update && this.location) {
      const locationId = this.location.id;
      this.locationService.updateLocationFromPending(locationId, this.selectedPending.id, update)
        .subscribe({
          next: () => {
            this.alertService.open('Зміни підтверджено успішно!');
            this.closeModal();
            this.loadPendingLocations(); // оновимо список
            this.locationService.getLocationById(locationId).subscribe(loc => this.location = loc); // оновити головну локацію
          },
          error: (err) => {
            console.error('Помилка при оновленні:', err);
            this.alertService.open('Помилка при підтвердженні змін');
          }
        });
    }
  }

  submitPendingRejection(reason: string) {
    this.locationService.rejectPending(this.selectedPending.id, reason).subscribe({
      next: () => {
        this.alertService.open('Пендінг відхилено');
        this.closeModal();
        this.loadPendingLocations();
      },
      error: (err) => {
        console.error('Помилка при відхиленні пендінгу:', err);
        this.alertService.open('Не вдалося відхилити пендінг');
        this.closeModal();
      }
    });
  }

  openDuplicateModal(loc: any) {
    this.dublicateLocation = loc;
    this.showDuplicateForm = true;
  }

  closeDuplicateModal() {
    this.showDuplicateForm = false;
    this.dublicateLocation = null;
  }

  confirmDuplicateChanges(update: any) {
    if (update && this.location && this.dublicateLocation) {
      const duplicateId = this.dublicateLocation.id;
      this.locationService.updateDuplicateFromLocation(this.location.id, duplicateId, update)
        .subscribe({
          next: () => {
            this.alertService.open('Зміни підтверджено успішно!');
            this.closeDuplicateModal();

            this.router.navigate([`/locations/${duplicateId}`]).then(() => {
              window.location.reload();
            });
          },
          error: (err) => {
            console.error('Помилка при оновленні:', err);
            this.alertService.open('Помилка при підтвердженні змін');
          }
        });
    }
  }
}
