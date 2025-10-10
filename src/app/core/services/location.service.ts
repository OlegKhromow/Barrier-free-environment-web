import {Injectable} from '@angular/core';
import {BehaviorSubject, map, Observable} from 'rxjs';
import {Location} from '../models/location';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {LocationType} from '../models/location-type';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private baseUrl = `${environment.apiEndpoint}/api/`;
  private locationTypes$ = new BehaviorSubject<LocationType[]>([]);

  constructor(private http: HttpClient) {
  }


  createLocation(dto: any) {
    return this.http.post<Location>(`${this.baseUrl}locations`, dto);
  }

  // вантажимо типи з бекенду
  loadLocationTypes(): void {
    this.http.get<LocationType[]>(`${this.baseUrl}location-types/`)
      .subscribe(types => this.locationTypes$.next(types));
  }

  // щоб компоненти могли підписатись
  getLocationTypes(): Observable<LocationType[]> {
    return this.locationTypes$.asObservable();
  }

  checkDuplicates(dto: any): Observable<HttpResponse<any>> {
    console.log(`${this.baseUrl}locations/check-duplicates`)
    return this.http.post<any>(`${this.baseUrl}locations/check-duplicates`, dto, { observe: 'response' });
  }

  // щоб зручно діставати ім’я по id
  getTypeName(id: string): string {
    const type = this.locationTypes$.getValue().find(t => t.id === id);
    return type ? type.name : 'Невідомо';
  }

  getCriteriaTreeByTypeId(locationId: string) {
    return this.http.get<any>(`${this.baseUrl}locations/${locationId}/criteria-tree`);
  }


  getLocationById(id: string) {
    return this.http.get(`${this.baseUrl}locations/${id}/`);
  }



  getLocations(): Observable<Location[]> {
    return this.http.get<any>(`${this.baseUrl}locations`).pipe(
      map(res =>
        res.locationReadDTOS.map((dto: any) => {
          // шукаємо потрібний тип у вже вигруженому масиві
          const typeObj = this.locationTypes$.value.find(t => t.id === dto.type)!;

          return new Location(
            dto.id,
            dto.name,
            dto.address,
            {
              type: 'Point',
              coordinates: [dto.coordinates.lng, dto.coordinates.lat]
            },
            typeObj, // завжди буде LocationType
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
          );
        })
      )
    );
  }





}
