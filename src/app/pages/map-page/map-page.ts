import { CommonModule } from '@angular/common';
import {AfterViewInit, Component, inject} from '@angular/core';
import * as L from 'leaflet';
import {Location} from '../../core/models/location';
import {LocationService} from '../../core/services/location.service';
import {LocationSidebarComponent} from '../../components/location-sidebar/location-sidebar.component';
import {RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {LocationCreateFormComponent} from '../../components/location-create-form/location-create-form.component';


@Component({
  selector: 'app-map-page',
  standalone: true,          // якщо ще не standalone, додай
  imports: [
    CommonModule,             // <-- обов’язково
    LocationSidebarComponent,
    RouterLink
  ],
  templateUrl: './map-page.html',
  styleUrls: ['./map-page.css'] // поправив typo styleUrl → styleUrls
})
export class MapPage implements AfterViewInit {
  private map!: L.Map;
  locations: Location[] | undefined;
  selectedLocation: Location | null = null;
  markers: any [] = [];
  addingMode = false;
  tempMarker: L.Marker | null = null;
  private dialog = inject(MatDialog);


  private locationService: LocationService = inject(LocationService);

  ngAfterViewInit(): void {
    this.initMap();
    this.fetchLocations();
  }

  toggleAddingMode(): void {
    this.addingMode = !this.addingMode;

    if (this.addingMode) {
      this.map.getContainer().style.cursor = 'crosshair'; // режим вибору
    } else {
      this.map.getContainer().style.cursor = ''; // нормальний курсор
      // Якщо був тимчасовий маркер і ми відмінили — прибираємо його
      if (this.tempMarker) {
        this.map.removeLayer(this.tempMarker);
        this.tempMarker = null;
      }
    }
  }





  private fetchLocations(): void {
    this.locationService.getLocations().subscribe({
      next: value => {
        console.log('Locations from API:', value);
        this.locations = value;
        this.addMarkers(); // create markers after data arrives
      },
      error: err => console.error('Error loading locations:', err)
    });
  }

  private addMarkers(): void {
    this.locations?.forEach(location => {
      const iconUrl = `assets/map-markers/1.png`;
      const icon = this.createMarkerIcon(iconUrl, [35, 40]);
      const marker = L.marker([location.latitude, location.longitude], {icon}).addTo(this.map);
      marker.on('click', () => this.clickOnMarker(location, marker));
      this.markers.push({marker, iconUrl, baseSize: [35, 40]});
    });
  }



  private initMap(): void {
    this.map = L.map('map', {
      center: [51.4982, 31.2893], // Чернігів
      zoom: 13
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.locations?.forEach(location => {
      const iconUrl = `assets/map-markers/${location.type.id}.png`;
      let icon = this.createMarkerIcon(iconUrl, [35, 40]);
      const marker = L.marker([location.latitude, location.longitude], {icon}).addTo(this.map);
      marker.on('click', () => this.clickOnMarker(location, marker));
      this.markers.push({marker, iconUrl, baseSize: [35, 40]});
    });

    this.map.on('zoomend', () => {
      const zoom = this.map.getZoom();
      const scale = zoom / 14;
      this.markers.forEach(m => {
        const newWidth = m.baseSize[0] * scale; // 13 – базовий зум
        const newHeight = m.baseSize[1] * scale; // 13 – базовий зум
        const newIcon = this.createMarkerIcon(m.iconUrl, [newWidth, newHeight]);
        m.marker.setIcon(newIcon);
      });
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.addingMode) {
        // Вимикаємо режим після кліку
        this.addingMode = false;
        this.map.getContainer().style.cursor = '';

        // Беремо координати з кліку
        const { lat, lng } = e.latlng;

        // Відкриваємо форму у діалозі
        const dialogRef = this.dialog.open(LocationCreateFormComponent, {
          width: '500px',
          data: { lat, lng }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log('Форма повернула DTO:', result);

            // Додаємо lastVerifiedAt "зараз"
            const dto = {
              ...result,
              lastVerifiedAt: new Date().toISOString()
            };

            this.locationService.createLocation(dto).subscribe({
              next: () => this.fetchLocations(),
              error: err => console.error('Помилка при створенні локації:', err)
            });
          }
        });
      }
    });





    // // Додаємо точки по кліку
    // this.map.on('click', (e: L.LeafletMouseEvent) => {
    //   const coords = {lat: e.latlng.lat, lng: e.latlng.lng};
    //   L.marker([coords.lat, coords.lng]).addTo(this.map)
    //     .bindPopup(`Координати: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
    //     .openPopup();
    // });
  }

  // removePoint(index: number): void {
  //   this.points.splice(index, 1);
  //   this.map.eachLayer(layer => {
  //     if (layer instanceof L.Marker) {
  //       this.map.removeLayer(layer);
  //     }
  //   });
  //
  //   // Перемальовуємо точки після видалення
  //   this.locations?.forEach(location => {
  //     let icon = this.createMarkerIcon(`assets/map-markers/${location.type.id}.png`);
  //     L.marker([location.latitude, location.longitude], {icon}).addTo(this.map);
  //   });
  //   this.points.forEach(p => {
  //     L.marker([p.lat, p.lng]).addTo(this.map);
  //   });
  // }

  clickOnMarker(location: Location, marker: L.Marker) {
    this.selectedLocation = location;
    this.markers.forEach(m => m.marker.setZIndexOffset(0))
    marker.setZIndexOffset(1000);
  }

  private createMarkerIcon(iconUrl: string, size: [number, number]): L.Icon {
    return new L.Icon({
      iconUrl: iconUrl,
      iconSize: size,
    });
  }
}
