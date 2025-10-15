import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LocationService } from '../../core/services/location.service';
import { Location } from '../../core/models/location';

@Component({
  selector: 'app-locations-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './locations-list-page.component.html',
  styleUrls: ['./locations-list-page.component.css']
})
export class LocationsListPage implements OnInit {
  private locationService = inject(LocationService);

  locations: Location[] = [];
  locationPendingMap = new Map<Location, any>();
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    // завантажуємо типи локацій перед основними даними
    this.locationService.loadLocationTypes();
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      locations: this.locationService.getLocations(),
      pending: this.locationService.getUserPendingLocations()
    }).subscribe({
      next: ({ locations, pending }) => {
        this.locations = locations;

        // формуємо мапу зв’язку: Location → PendingLocation
        this.locationPendingMap.clear();
        locations.forEach(loc => {
          const match = pending.find(p => p.locationId === loc.id);
          if (match) {
            this.locationPendingMap.set(loc, match);
          }
        });

        console.log('📍 Locations → Pending map:', this.locationPendingMap);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching locations or pending:', err);
        this.error = 'Не вдалося завантажити список локацій.';
        this.loading = false;
      }
    });
  }

  truncate(text: string, length: number = 100): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '…' : text;
  }

  hasPending(location: Location): boolean {
    return this.locationPendingMap.has(location);
  }
}
