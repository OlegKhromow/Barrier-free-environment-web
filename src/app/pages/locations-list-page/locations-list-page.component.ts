import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {PaginationInstance} from 'ngx-pagination';
import { NgxPaginationModule } from 'ngx-pagination';
import { forkJoin } from 'rxjs';
import { LocationService } from '../../core/services/location.service';
import { Location } from '../../core/models/location';
import { FormsModule } from '@angular/forms';
import { ElementsByStringPipe } from '../../filters/location-by-title-pipe';
import { LocationType } from '../../core/models/location-type';
import { LocationStatusEnum } from '../../core/models/location-status-enum';

@Component({
  selector: 'app-locations-list-page',
  standalone: true,
  imports: [CommonModule, RouterLink,NgxPaginationModule, FormsModule, ElementsByStringPipe],
  templateUrl: './locations-list-page.component.html',
  styleUrls: ['./locations-list-page.component.css']
})
export class LocationsListPage implements OnInit {
  private locationService = inject(LocationService);

  locations: Location[] = [];
  pendingCounts: Record<string, number> = {}; // locationId (UUID) → кількість pending
  loading = false;
  error: string | null = null;

  // Pagination settings
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;

  //filtering
  filterTitle: string = "";
  filterDescription: string = "";
  locationTypes: LocationType[] = [];
  statuses = Object.values(LocationStatusEnum);
  selectedTypeId = 'all';
  selectedStatus: LocationStatusEnum | 'all' = 'all';

  public pagingConfig: PaginationInstance = {
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
      totalItems: this.totalItems
    };

  ngOnInit(): void {
    this.locationService.loadLocationTypes();
    this.locationService.getLocationTypesObservable().subscribe(types => {
    this.locationTypes = types;
    this.loadLocations();
  });
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
        this.totalItems = locations.length;

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

   onTableDataChange(event: any): void {
        this.pagingConfig.currentPage = event;
    }

    onTableSizeChange(event: any): void {
        this.pagingConfig.itemsPerPage = event.target.value;
        this.pagingConfig.currentPage = 1;
    }

  clearFiltersInputs() {
    this.filterTitle = '';
    this.filterDescription = '';
    this.selectedTypeId = 'all';
    this.selectedStatus = 'all';
  }
}
