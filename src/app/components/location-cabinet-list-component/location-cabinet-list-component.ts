import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PaginationInstance,NgxPaginationModule} from 'ngx-pagination';
import { OnInit, inject } from '@angular/core';
import { LocationService } from '../../core/services/location.service';
import { Location } from '../../core/models/location';
import { ActivatedRoute,RouterModule } from '@angular/router';
import { TruncateDescriptionPipePipe } from '../../filters/truncate-description-pipe';
import { ElementsByStringPipe } from '../../filters/location-by-title-pipe';
import { LocationType } from '../../core/models/location-type';
import { LocationStatusEnum } from '../../core/models/location-status-enum';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-location-cabinet-list-component',
  imports: [CommonModule, RouterModule,NgxPaginationModule,ElementsByStringPipe, TruncateDescriptionPipePipe, FormsModule],
  templateUrl: './location-cabinet-list-component.html',
  styleUrl: './location-cabinet-list-component.css'
})
export class LocationCabinetListComponent implements OnInit {
  private locationService = inject(LocationService);
  private route = inject(ActivatedRoute);

  locations: Location[] = [];
  pendingLocations: any[] = [];
  loading = true;
  error: string | null = null;
  isAdmin = false;

// Pagination settings
  currentPage = 1;
  itemsPerPage = 8;
  totalItems = 0;
  pendingCounts: Record<string, number> = {};

  //filtering
  filterTitle: string = "";
  filterDescription: string = "";
  locationTypes: LocationType[] = [];
  statuses = Object.values(LocationStatusEnum);
  selectedTypeId = 'all';
  selectedStatus: LocationStatusEnum | 'all' = 'all'

  public pagingConfig: PaginationInstance = {
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
      totalItems: this.totalItems
    };

  ngOnInit() {
    this.loadUserLocations();
    this.route.queryParamMap.subscribe(params => {
      this.isAdmin = params.get('isAdmin') === 'true';
    });
    this.locationService.loadLocationTypes();
    this.locationService.getLocationTypesObservable().subscribe(types => {
    this.locationTypes = types;
  });
  }


  loadUserLocations() {
    this.loading = true;

    this.locationService.getUserModifiedLocations().subscribe({
      next: (locations) => {
        this.locations = locations;

        this.locationService.getUserPendingLocations().subscribe({
          next: (pending) => {
            this.pendingLocations = pending;
            console.log(this.pendingLocations);
            this.loading = false;
          },
          error: (err) => {
            console.error('Помилка при завантаженні pending-локацій', err);
            this.pendingLocations = [];
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Помилка при завантаженні локацій користувача', err);
        this.error = 'Не вдалося отримати список локацій';
        this.loading = false;
      },
    });
  }

  ifPending(locationId: string): boolean {
    return this.pendingLocations.some(p => p.locationId === locationId);
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
