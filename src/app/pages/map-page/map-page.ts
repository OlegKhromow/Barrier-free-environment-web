import { CommonModule } from '@angular/common';
import {AfterViewInit, Component, inject, OnInit} from '@angular/core';
import * as L from 'leaflet';
import { Location } from '../../core/models/location';
import { LocationService } from '../../core/services/location.service';
import { LocationSidebarComponent } from '../../components/location-sidebar/location-sidebar.component';
import { RouterLink } from '@angular/router';
import { LocationCreateFormComponent } from '../../components/location-create-form/location-create-form.component';

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
  markers: any[] = [];
  addingMode = false;
  tempMarker: L.Marker | null = null;

  showCreateForm = false;
  clickedLat: number | null = null;
  clickedLng: number | null = null;

  private locationService: LocationService = inject(LocationService);

  ngAfterViewInit(): void {
    this.initMap();
    this.fetchLocations();
  }

  ngOnInit(): void {
    this.locationService.loadLocationTypes(); // підвантажили один раз
  }

  toggleAddingMode(): void {
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
    this.locationService.getLocations().subscribe({
      next: value => {
        this.locations = value;
        this.addMarkers();
      },
      error: err => console.error('Error loading locations:', err)
    });
  }

  private addMarkers(): void {
    this.locations?.forEach(location => {
      const iconUrl = `assets/map-markers/1.png`;
      const icon = this.createMarkerIcon(iconUrl, [35, 40]);
      const marker = L.marker([location.latitude, location.longitude], { icon }).addTo(this.map);
      marker.on('click', () => this.clickOnMarker(location, marker));
      this.markers.push({ marker, iconUrl, baseSize: [35, 40] });
    });
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [51.4982, 31.2893],
      zoom: 13
    });
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
      if (this.addingMode) {
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
    this.selectedLocation = JSON.parse(JSON.stringify(location)) as Location;
    this.markers.forEach(m => m.marker.setZIndexOffset(0));
    marker.setZIndexOffset(1000);
  }



  private createMarkerIcon(iconUrl: string, size: [number, number]): L.Icon {
    return new L.Icon({
      iconUrl: iconUrl,
      iconSize: size
    });
  }
}
