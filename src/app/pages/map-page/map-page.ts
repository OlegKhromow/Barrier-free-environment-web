import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { Location } from '../../core/models/location';
import { LocationService } from '../../core/services/location.service';
import { LocationSidebarComponent } from '../../components/location-sidebar/location-sidebar.component';
import { RouterLink } from '@angular/router';
import { LocationCreateFormComponent } from '../../components/location-create-form/location-create-form.component';
import { MatDialog } from '@angular/material/dialog';
import { DuplicatesDialogComponent } from '../../components/duplicates-dialog/duplicates-dialog.component';
import { FormStateService } from '../../core/services/form-state.service';
import {forkJoin} from 'rxjs';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [
    CommonModule,
    LocationSidebarComponent,
    RouterLink,
    LocationCreateFormComponent
  ],
  templateUrl: './map-page.html',
  styleUrls: ['./map-page.css']
})
export class MapPage implements OnInit, AfterViewInit {
  private map!: L.Map;
  locations: Location[] | undefined;
  selectedLocation: Location | null = null;
  markers: Array<{ marker: L.Marker, iconUrl: string, baseSize: [number, number], location?: Location }> = [];
  addingMode = false;
  tempMarker: L.Marker | null = null;
  showCreateForm = false;
  clickedLat: number | null = null;
  clickedLng: number | null = null;
  locationPendingMap = new Map<Location, any>();

  // duplicate режим
  duplicateMode = false;
  duplicateTargetId: string | null = null;
  duplicateSimilar: Array<any> | null = null;
  duplicateDto: any | null = null;

  private locationService = inject(LocationService);
  private dialog = inject(MatDialog);
  private formState = inject(FormStateService);

  ngAfterViewInit(): void {
    this.initMap();
    this.fetchLocations();
  }

  ngOnInit(): void {
    this.locationService.loadLocationTypes();

    // очищаємо форму тільки при першому заході
    const firstLoad = !sessionStorage.getItem('mapPageLoaded');
    if (firstLoad) {
      this.formState.clearFormData();
      sessionStorage.setItem('mapPageLoaded', 'true');
    }

    console.log('MapPage init');
  }

  toggleAddingMode(): void {
    if (this.duplicateMode) return;

    this.addingMode = !this.addingMode;
    if (this.addingMode) {
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

  private fetchLocations(): void {
    forkJoin({
      locations: this.locationService.getLocations(),
      pending: this.locationService.getUserPendingLocations()
    }).subscribe({
      next: ({ locations, pending }) => {
        this.locations = locations;
        this.addMarkers();

        // формуємо Map<Location, PendingLocation>
        this.locationPendingMap.clear();
        locations.forEach(loc => {
          const match = pending.find(p => p.locationId === loc.id);
          if (match) {
            this.locationPendingMap.set(loc, match);
          }
        });

        console.log('📍 Map Location → PendingLocation:', this.locationPendingMap);
      },
      error: err => console.error('Error fetching locations or pending:', err)
    });
  }


  private addMarkers(): void {
    this.locations?.forEach(location => {
      const iconUrl = 'assets/map-markers/1.png';
      const icon = this.createMarkerIcon(iconUrl, [35, 40]);
      const marker = L.marker([location.latitude, location.longitude], { icon }).addTo(this.map);

      marker.on('click', () => {
        if (this.duplicateMode) return;
        this.clickOnMarker(location, marker);
      });

      this.markers.push({ marker, iconUrl, baseSize: [35, 40], location });
    });
  }

  private initMap(): void {
    this.map = L.map('map', { center: [51.4982, 31.2893], zoom: 13 });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

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
        const { lat, lng } = e.latlng;
        this.clickedLat = lat;
        this.clickedLng = lng;
        this.showCreateForm = true;
      }
    });
  }

  handleFormClose(dto: any | null) {
    this.showCreateForm = false;
    if (dto) {
      this.locationService.createLocation(dto).subscribe({
        next: () => this.fetchLocations(),
        error: err => console.error('Помилка при створенні локації:', err)
      });
    }
  }

  clickOnMarker(location: Location, marker: L.Marker) {
    this.selectedLocation = JSON.parse(JSON.stringify(location));
    this.markers.forEach(m => m.marker.setZIndexOffset(0));
    marker.setZIndexOffset(1000);

    const zoomLevel = Math.min(this.map.getZoom() + 2, 17);
    this.map.flyTo(marker.getLatLng(), zoomLevel, { animate: true, duration: 0.8 });
  }

  private createMarkerIcon(iconUrl: string, size: [number, number]): L.Icon {
    return new L.Icon({ iconUrl, iconSize: size as any });
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
      this.map.flyTo(found.marker.getLatLng(), 17, { animate: true, duration: 0.9 });
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
      data: { similar: this.duplicateSimilar },
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
          this.map.flyTo(found.marker.getLatLng(), 17, { animate: true, duration: 0.9 });
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
}
