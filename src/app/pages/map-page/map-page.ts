import {CommonModule} from '@angular/common';
import {AfterViewInit, Component, HostListener, inject, OnInit} from '@angular/core';
import * as L from 'leaflet';
import {Location} from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';
import {LocationSidebarComponent} from '../../components/location-sidebar/location-sidebar.component';
import {LocationCreateFormComponent} from '../../components/location-create-form/location-create-form.component';
import {MatDialog} from '@angular/material/dialog';
import {DuplicatesDialogComponent} from '../../components/duplicates-dialog/duplicates-dialog.component';
import {FormStateService} from '../../core/services/form-state.service';
import {forkJoin, of} from 'rxjs';
import {AuthService} from '../../core/services/security/auth.service';
import { v4 as uuidv4 } from 'uuid';
import {FormsModule} from '@angular/forms';
import {LayerGroup} from 'leaflet';
import { LocateControl } from "leaflet.locatecontrol";
import "leaflet.locatecontrol/dist/L.Control.Locate.min.css";


@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [
    CommonModule,
    LocationSidebarComponent,
    LocationCreateFormComponent,
    FormsModule
  ],
  templateUrl: './map-page.html',
  styleUrls: ['./map-page.css']
})
export class MapPage implements OnInit, AfterViewInit {
  private map!: L.Map;
  private normalLayer!: L.TileLayer;
  private satelliteLayer!: L.TileLayer;
  private labelsLayer!: LayerGroup;
  isSatellite = false;

  locations: Location[] | undefined;
  selectedLocation: Location | null = null;
  markers: Array<{ marker: L.Marker, iconUrl: string, baseSize: [number, number], location?: Location }> = [];
  addingMode = false;
  tempMarker: L.Marker | null = null;
  showCreateForm = false;
  clickedLat: number | null = null;
  clickedLng: number | null = null;
  locationPendingMap = new Map<Location, any>();
  userMarker: L.Marker | null = null;
  isBuildingRoute = false;


  private myLocation: { lat: number, lng: number } | null = null;
  private currentRoute: L.Polyline | null = null;
  routeMode: 'feet' | 'wheelchair' = 'feet';


  // duplicate режим
  duplicateMode = false;
  duplicateTargetId: string | null = null;
  duplicateSimilar: Array<any> | null = null;
  duplicateDto: any | null = null;
  tempUUID: string | undefined;

  private locationService = inject(LocationService);
  private dialog = inject(MatDialog);
  private formState = inject(FormStateService);
  private authService = inject(AuthService);

  // resize fields for location-sidebar
  sidebarWidth = 370;
  minSidebarWidth = 350;
  maxSidebarWidth = 500;
  isResizing = false;

  ngAfterViewInit(): void {
    this.initMap();

    // Спочатку завантажуємо локації, а потім обробляємо flyTo + selectedId
    this.fetchLocations(() => {
      const params = new URLSearchParams(window.location.search);
      const flyToLat = params.get('flyToLat');
      const flyToLng = params.get('flyToLng');
      const selectedId = params.get('selectedId');

      if (flyToLat && flyToLng) {
        const lat = parseFloat(flyToLat);
        const lng = parseFloat(flyToLng);

        setTimeout(() => {
          this.map.flyTo([lat, lng], 17, {animate: true, duration: 0.9});

          // якщо є selectedId — відкриваємо сайдбар з цією локацією
          if (selectedId && this.locations) {
            const found = this.locations.find(l => l.id === selectedId);
            if (found) {
              this.selectedLocation = JSON.parse(JSON.stringify(found));

              const foundMarker = this.markers.find(m => m.location?.id === found.id);
              if (foundMarker) {
                foundMarker.marker.setZIndexOffset(1000);
              }
            }
          }
        }, 600);
      }
    });

    this.calculateDynamicSizes();
  }

  ngOnInit(): void {
    this.locationService.loadLocationTypes();

    // очищаємо форму тільки при першому заході
    const firstLoad = !sessionStorage.getItem('mapPageLoaded');
    if (firstLoad) {
      this.formState.clearFormData();
      sessionStorage.setItem('mapPageLoaded', 'true');
    }
  }



  toggleAddingMode(): void {
    if (this.duplicateMode) return;

    if (!this.authService.isLoggedIn()) {
      this.openLoginModal();
      return;
    }

    this.addingMode = !this.addingMode;
    if (this.addingMode) {
      this.formState.clearFormData();
      this.map.getContainer().style.cursor = 'crosshair';
    } else {
      this.map.getContainer().style.cursor = '';
      if (this.tempMarker) {
        this.map.removeLayer(this.tempMarker);
        this.tempMarker = null;
      }
      this.showCreateForm = false;
    }
  }

  openLoginModal() {
    this.authService.openLoginModal();
  }


  private fetchLocations(afterLoad?: () => void): void {
    const isLogged = this.authService.isLoggedIn(); // ✅ перевірка логіну

    const requests = isLogged
      ? {
        locations: this.locationService.getLocations(),
        pending: this.locationService.getUserPendingLocations()
      }
      : {
        locations: this.locationService.getLocations(),
        pending: of([]) // пустий Observable для анонімних
      };

    forkJoin(requests).subscribe({
      next: ({locations, pending}) => {
        console.log(locations);
        this.locations = locations;
        this.addMarkers();

        // формуємо Map<Location, PendingLocation> тільки якщо є pending
        this.locationPendingMap.clear();
        if (Array.isArray(pending)) {
          locations.forEach(loc => {
            const match = pending.find(p => p.locationId === loc.id);
            if (match) {
              this.locationPendingMap.set(loc, match);
            }
          });
        }

        console.log('📍 Map Location → PendingLocation:', this.locationPendingMap);

        if (afterLoad) afterLoad();
      },
      error: err => console.error('Error fetching locations or pending:', err)
    });
  }

  private addMarkers(): void {
    this.locations?.forEach(location => {
      const iconUrl = 'assets/map-markers/1.png';
      const icon = this.createMarkerIcon(iconUrl, [35, 40]);
      const marker = L.marker([location.latitude, location.longitude], {icon}).addTo(this.map);

      marker.on('click', () => {
        if (this.duplicateMode) return;
        this.clickOnMarker(location, marker);
      });

      this.markers.push({marker, iconUrl, baseSize: [35, 40], location});
    });
  }

  private loadRoutes(): void {
    // Якщо є попередній маршрут — видаляємо
    if (this.currentRoute) {
      this.map.removeLayer(this.currentRoute);
      this.currentRoute = null;
    }

    //TODO instead of ee6adb8c-14a4-4647-ae7c-36273a6d8488" it will be this.tempUUID
    this.locationService.getRouteByRoute_key(this.tempUUID).subscribe({
      next: route => {
        if (route.coordinates && route.coordinates.length > 1) {

          // Створюємо новий polyline і зберігаємо посилання
          this.currentRoute = L.polyline(route.coordinates, {
            weight: 5,
            opacity: 0.9
          }).addTo(this.map);

          const start = route.coordinates[0];
          const finish = route.coordinates[route.coordinates.length - 1];

          this.map.fitBounds([start, finish], {
            padding: [50, 50],
            animate: true
          });
        }
      },
      error: err => console.error('Failed to load route', err)
    });
  }




  private initMap(): void {
    this.map = L.map('map', {center: [51.4982, 31.2893], zoom: 13});
    const lc = new LocateControl({
      position: "topleft",
      flyTo: true,
      drawMarker: true,
      showCompass: true
    });

    lc.addTo(this.map);

    this.map.on('locateactivate', () => {
      if (this.currentRoute) {
        this.map.removeLayer(this.currentRoute);
        this.currentRoute = null;
      }
    });
    this.map.on('locatedeactivate', () => {
      if (this.currentRoute) {
        this.map.removeLayer(this.currentRoute);
        this.currentRoute = null;
      }
    });

    this.map.on("locationfound", (e: L.LocationEvent) => {

      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Зберігаємо
      this.myLocation = { lat, lng };
    });


    this.map.createPane('labels');
    this.map.getPane('labels')!.style.zIndex = '650';
    this.map.getPane('labels')!.style.pointerEvents = 'none';

    // Стандартна OSM
    this.normalLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap contributors' }
    );

    // Супутник ESRI
    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles © Esri' }
    );

    // Підписи доріг + вулиць
    const transportation = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri Roads',
        pane: 'labels'
      }
    );

    // Підписи місць
    const places = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri Places',
        pane: 'labels'
      }
    );

    // комбінований overlay для супутника
    this.labelsLayer = L.layerGroup([transportation, places]);

    this.normalLayer.addTo(this.map);

    this.map.on('zoomend', () => {
      const zoom = this.map.getZoom();
      const scale = zoom / 14;
      this.markers.forEach(m => {
        const newWidth = m.baseSize[0] * scale;
        const newHeight = m.baseSize[1] * scale;
        const newIcon = this.createMarkerIcon(m.iconUrl, [newWidth, newHeight]);
        m.marker.setIcon(newIcon);
      });
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.addingMode && !this.duplicateMode) {
        this.addingMode = false;
        this.map.getContainer().style.cursor = '';
        const {lat, lng} = e.latlng;
        this.clickedLat = lat;
        this.clickedLng = lng;
        this.showCreateForm = true;
      }
    });
  }

  toggleMapLayer() {
    if (this.isSatellite) {
      this.map.removeLayer(this.satelliteLayer);
      this.map.removeLayer(this.labelsLayer);
      this.map.addLayer(this.normalLayer);
    } else {
      this.map.removeLayer(this.normalLayer);
      this.map.addLayer(this.satelliteLayer);
      this.labelsLayer.addTo(this.map);
    }

    this.isSatellite = !this.isSatellite;
  }


  isPageLoading = false;

  handleFormClose(dto: any | null) {
    if (!dto) {
      this.showCreateForm = false;
      return;
    }

    dto.imageServiceId = uuidv4();

    // Включаємо завантаження для всієї сторінки
    this.isPageLoading = true;

    // Step 1: check location validity first
    this.locationService.isValid(dto).subscribe({
      next: () => {
        // Step 2: if location valid → check images validity
        if (dto.selectedImages && dto.selectedImages.length > 0) {
          this.checkImagesValidity(dto);
        } else {
          // Якщо зображень немає - створюємо локацію одразу
          this.createLocationAndUploadImages(dto);
        }
      },
      error: (err) => {
        this.isPageLoading = false; // Вимикаємо завантаження при помилці
        const message =
          err?.error?.description ||
          err?.error?.message ||
          err?.message ||
          'Сталася помилка при перевірці валідності локації.';
        alert(`Локація невалідна:\n${message}`);
      }
    });
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
            this.createLocationAndUploadImages(dto);
          }
        },
        error: (err) => {
          this.isPageLoading = false; // Вимикаємо завантаження при помилці
          const message = err?.error?.message || err?.message || 'Сталася помилка при перевірці зображення.';
          alert(`Зображення невалідне (${img.file.name}):\n${message}`);
        }
      });
    });
  }

  private createLocationAndUploadImages(dto: any) {
    // Step 3: create location
    this.locationService.createLocation(dto).subscribe({
      next: (createdLocation) => {
        // Step 4: upload images if they exist
        if (dto.selectedImages && dto.selectedImages.length > 0) {
          const imageServiceId = createdLocation.imageServiceId;
          let uploadsCompleted = 0;
          const totalUploads = dto.selectedImages.length;

          dto.selectedImages.forEach((img: { file: File }) => {
            const imageId = uuidv4();
            this.locationService.uploadLocationImage(imageServiceId, imageId, img.file).subscribe({
              next: () => {
                console.log(`🖼️ Завантажено зображення ${img.file.name}`);
                uploadsCompleted++;

                // Коли всі завантаження завершені
                if (uploadsCompleted === totalUploads) {
                  this.isPageLoading = false;
                  this.showCreateForm = false;
                  this.fetchLocations();
                }
              },
              error: err => {
                this.isPageLoading = false;
                console.error('Помилка завантаження зображення:', err);
              }
            });
          });

          // Якщо немає зображень для завантаження
          if (totalUploads === 0) {
            this.isPageLoading = false;
            this.showCreateForm = false;
            this.fetchLocations();
          }
        } else {
          // Якщо зображень немає
          this.isPageLoading = false;
          this.showCreateForm = false;
          this.fetchLocations();
        }
      },
      error: (err) => {
        this.isPageLoading = false;
        const message =
          err?.error?.description ||
          err?.error?.message ||
          err?.message ||
          'Сталася невідома помилка при створенні локації.';
        alert(`Помилка при створенні локації:\n${message}`);
      }
    });
  }


  clickOnMarker(location: Location, marker: L.Marker) {
    this.selectedLocation = JSON.parse(JSON.stringify(location));
    this.markers.forEach(m => m.marker.setZIndexOffset(0));
    marker.setZIndexOffset(1000);

    const zoomLevel = Math.min(this.map.getZoom() + 2, 17);
    this.map.flyTo(marker.getLatLng(), zoomLevel, {animate: true, duration: 0.8});
  }

  private createMarkerIcon(iconUrl: string, size: [number, number]): L.Icon {
    return new L.Icon({iconUrl, iconSize: size as any});
  }

  // === DUPLICATES ===
  handleViewDuplicate(payload: { id: string, similar: Array<any>, dto: any }) {
    console.log('>>> Перейшов у duplicateMode');
    if (!payload || !payload.id) return;

    // кожного разу активуємо duplicateMode, щоб форма точно не з'явилась
    this.duplicateMode = true;
    this.showCreateForm = false;

    this.duplicateTargetId = payload.id;
    this.duplicateSimilar = payload.similar || null;
    this.duplicateDto = payload.dto || null;

    const found = this.markers.find(m => m.location && m.location.id === payload.id);
    if (found) {
      this.selectedLocation = found.location || null;
      found.marker.setZIndexOffset(1000);
      this.map.flyTo(found.marker.getLatLng(), 17, {animate: true, duration: 0.9});
    } else {
      console.warn('Не знайдено маркер для дубліката id=', payload.id);
    }
  }

  onDuplicateAnswer(answer: 'yes' | 'no') {
    console.log('<<< Вийшов з duplicateMode');

    if (answer === 'yes') {
      window.location.href = '/';
      return;
    }

    // answer === 'no' → відкриваємо список знову, але duplicateMode не вимикаємо
    this.openDuplicateDialogFromMap();
  }

  private openDuplicateDialogFromMap() {
    if (!this.duplicateSimilar) {
      this.resetDuplicateState();
      return;
    }

    const ref = this.dialog.open(DuplicatesDialogComponent, {
      data: {similar: this.duplicateSimilar},
      width: '600px'
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'proceed') {
        this.formState.clearFormData();
        if (this.duplicateDto) {
          this.locationService.createLocation(this.duplicateDto).subscribe({
            next: () => {
              this.fetchLocations();
              this.resetDuplicateState();
            },
            error: err => console.error('Помилка при створенні локації (duplicate proceed):', err)
          });
        } else {
          this.resetDuplicateState();
        }
      } else if (result.action === 'view' && result.id) {
        // при виборі іншого дубліката — знову активуємо duplicateMode
        this.duplicateMode = true;
        this.duplicateTargetId = result.id;

        const found = this.markers.find(m => m.location && m.location.id === result.id);
        if (found) {
          this.selectedLocation = found.location || null;
          this.map.flyTo(found.marker.getLatLng(), 17, {animate: true, duration: 0.9});
        }
      } else if (result.action === 'cancel') {
        this.resetDuplicateState();
      }
    });
  }

  private resetDuplicateState() {
    this.duplicateMode = false;
    this.selectedLocation = null;
    this.duplicateSimilar = null;
    this.duplicateDto = null;
    this.duplicateTargetId = null;
    this.showCreateForm = true;
  }

  calculateDynamicSizes() {
    this.recalculateMaxWidth();

    // мінімальна ширина по контенту
    const sidebarEl = document.querySelector("app-location-sidebar");
    if (sidebarEl) {
      const rect = sidebarEl.getBoundingClientRect();
      this.minSidebarWidth = rect.width + 20;    // фактичний мінімум
    }

    // захист
    if (this.sidebarWidth < this.minSidebarWidth) {
      this.sidebarWidth = this.minSidebarWidth;
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.recalculateMaxWidth();
  }

  recalculateMaxWidth() {
    // 80% від поточної ширини вікна
    this.maxSidebarWidth = window.innerWidth * 0.8;

    // Якщо поточна ширина більша за максимум — зменшуємо
    if (this.sidebarWidth > this.maxSidebarWidth) {
      this.sidebarWidth = this.maxSidebarWidth;
    }
  }

  startResizing() {
    this.isResizing = true;

    // Слухачі руху та відпускання
    document.addEventListener('mousemove', this.resizeHandler);
    document.addEventListener('mouseup', this.stopResizing);
  }

  resizeHandler = (event: MouseEvent) => {
    if (!this.isResizing) return;

    const newWidth = event.clientX;
    this.sidebarWidth = Math.min(
      this.maxSidebarWidth,
      Math.max(this.minSidebarWidth, newWidth)
    );
  };

  stopResizing = () => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.resizeHandler);
    document.removeEventListener('mouseup', this.stopResizing);
  };

  buildRoute() {
    this.tempUUID = uuidv4();
    console.log(this.tempUUID);
    if (!this.myLocation) {
      alert("Спочатку визначте свою локацію");
      return;
    }

    const { lat, lng } = this.myLocation;
    const border_minimum_height = this.routeMode === 'wheelchair' ? 2 : 5;

    this.isBuildingRoute = true;

    // Викликаємо бекенд
    this.locationService.buildRoute(
      border_minimum_height,
      lat,
      lng,
      this.tempUUID
    ).subscribe({
      next: (res) => {
        // все добре — будуємо і завантажуємо маршрути
        this.loadRoutes();
        this.isBuildingRoute = false;
      },
      error: (err) => {
        console.error(err);
        this.isBuildingRoute = false;
        alert("Помилка при побудові маршруту");
      }
    });
  }

}
