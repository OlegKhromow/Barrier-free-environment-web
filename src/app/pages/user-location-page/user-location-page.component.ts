import {AfterViewInit, Component, OnInit} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {LocationService} from '../../core/services/location.service';
import {Location} from '../../core/models/location';
import * as L from 'leaflet';
import {LocationInfoComponent} from '../../components/location-info/location-info.component';
import {SlideshowComponent} from '../../components/slideshow-component/slideshow-component';

@Component({
  selector: 'app-user-location-page',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, LocationInfoComponent, SlideshowComponent],
  templateUrl: './user-location-page.component.html',
  styleUrls: ['./user-location-page.component.css']
})
export class UserLocationPageComponent implements OnInit, AfterViewInit {
  location: Location | null = null;
  images: string[] | null = null;
  pendingLocations: any[] = [];
  criteriaTree: any | null = null;
  rejectionReason = '';

  private map!: L.Map;

  days = [
    { key: 'monday', label: 'Понеділок' },
    { key: 'tuesday', label: 'Вівторок' },
    { key: 'wednesday', label: 'Середа' },
    { key: 'thursday', label: 'Четвер' },
    { key: 'friday', label: 'П’ятниця' },
    { key: 'saturday', label: 'Субота' },
    { key: 'sunday', label: 'Неділя' }
  ];

  constructor(
    private route: ActivatedRoute,
    private locationService: LocationService,
    protected router: Router
  ) {}


  ngOnInit() {
    const id = String(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.locationService.getLocationById(id).subscribe(loc => {
        this.location = loc;
        console.log('✅ Location object:', loc);

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
            this.map.flyTo([lat, lng], 17, { animate: true, duration: 0.9 });
          }
        });
      });
    }
  }

  selectedPending: any = null;

  openPendingModal(pending: any) {
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
    return new L.Icon({ iconUrl, iconSize: size as any });
  }

  loadCriteriaTree() {
    if (this.location?.id) {
      this.locationService.getCriteriaTreeByTypeId(this.location.id)
        .subscribe(tree => this.criteriaTree = tree);
    }
  }

  loadPendingLocations() {
    if (this.location?.id) {
      this.locationService.getUserPendingLocationsByLocationId(this.location.id)
        .subscribe(data => {
          this.pendingLocations = data;
          console.log('🕒 Pending Locations:', data);
        });
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
}
