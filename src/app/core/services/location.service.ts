import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {Location} from '../models/location';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private baseUrl = `${environment.apiEndpoint}/api/locations`;

  constructor(private http: HttpClient) {
  }


  createLocation(dto: any) {
    return this.http.post<Location>(this.baseUrl, dto);
  }


  getLocations(): Observable<Location[]> {
    return this.http.get<any>(this.baseUrl).pipe(
      map(res =>
        res.locationReadDTOS.map((dto: any) =>
          new Location(
            dto.id,
            dto.name,
            dto.address,
            {
              type: 'Point',
              // [longitude, latitude] – Leaflet expects [lat, lng] as [y, x]
              coordinates: [dto.coordinates.lng, dto.coordinates.lat]
            },
            dto.type,
            dto.description,
            dto.contacts,
            dto.workingHours,
            dto.createdBy,
            dto.organizationId,
            dto.status,
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
