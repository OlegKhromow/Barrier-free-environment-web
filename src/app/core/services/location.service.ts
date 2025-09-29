import {Injectable} from '@angular/core';
import {map, Observable, of} from 'rxjs';
import {Location} from '../models/location';
import { environment } from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {LocationDto} from '../dtos/location-dto';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private baseUrl = `${environment.apiEndpoint}/api/locations`;

  constructor(private http: HttpClient) {
  }


  getLocations(): Observable<Location[]> {
    return this.http.get<{ locationReadDTOS?: LocationDto[] }>(`${this.baseUrl}`).pipe(
      map(response =>
        (response.locationReadDTOS ?? []).map(dto =>
          new Location(
            dto.id,
            dto.name,
            dto.address,
            {
              type: 'Point',
              coordinates: [dto.coordinates.lng, dto.coordinates.lat],
            },
            dto.type as any,
            dto.description,
            dto.contacts,
            dto.workingHours,
            dto.createdBy,
            dto.organizationId,
            dto.status as any,
            dto.overallAccessibilityScore,
            dto.createdAt,
            dto.updatedAt,
            dto.lastVerifiedAt,
            dto.rejectionReason
          )
        )
      )
    );
  }


}
