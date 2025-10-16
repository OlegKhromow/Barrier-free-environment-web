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
  pendingCounts: Record<string, number> = {}; // locationId (UUID) → кількість pending
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.locationService.loadLocationTypes();
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      locations: this.locationService.getLocations(),
      pending: this.locationService.getAllPendingLocations() // ← усі pending, без map
    }).subscribe({
      next: ({ locations, pending }) => {
        this.locations = locations;

        // Рахуємо кількість pending по кожному locationId (UUID)
        this.pendingCounts = pending.reduce((acc, p) => {
          if (p.locationId) {
            acc[p.locationId] = (acc[p.locationId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        console.log('📍 Pending counts:', this.pendingCounts);
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

  getPendingCount(locationId: string): number {
    return this.pendingCounts[locationId] || 0;
  }
}
