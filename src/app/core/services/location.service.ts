import {Injectable} from '@angular/core';
import {BehaviorSubject, map, Observable, switchMap} from 'rxjs';
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

  changeStatus(locationId: string, status: string, body?: any) {
    return this.http.patch(`${this.baseUrl}locations/${locationId}/status/${status}`, body || {});
  }

  deleteLocation(locationId: string) {
    return this.http.delete(`${this.baseUrl}locations/${locationId}`);
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
  getLocationTypesObservable(): Observable<LocationType[]> {
    console.log("відбувається вигрузка типів")
    return this.locationTypes$.asObservable();
  }

  checkDuplicates(dto: any): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${this.baseUrl}locations/check-duplicates`, dto, {observe: 'response'});
  }

  checkDuplicatesById(locationID: string): Observable<HttpResponse<any>> {
    return this.http.get<any>(`${this.baseUrl}locations/${locationID}/check-duplicates`, {observe: 'response'});
  }

  // щоб зручно діставати ім’я по id
  getTypeName(id: string): string {
    const type = this.locationTypes$.getValue().find(t => t.id === id);
    return type ? type.name : 'Невідомо';
  }

  getCriteriaTreeByTypeId(locationId: string) {
    return this.http.get<any>(`${this.baseUrl}locations/${locationId}/criteria-tree`);
  }

  getCriteriaTreeByUser(locationId: string) {
    return this.http.get<any>(`${this.baseUrl}locations/me/${locationId}/criteria-tree`);
  }

  createPendingCopy(locationId: string, dto: any): Observable<any> {
    return this.http.post(`${this.baseUrl}locations/to_pending/${locationId}/`, dto);
  }


  getLocationById(id: string): Observable<Location> {
    return this.http.get<any>(`${this.baseUrl}locations/${id}/`).pipe(
      switchMap(dto =>
        this.http.get<any>(`${this.baseUrl}locations/${id}/location_type`).pipe(
          map(typeDto => {
            return new Location(
              dto.id,
              dto.name,
              dto.address,
              {
                type: 'Point',
                coordinates: [dto.coordinates.lng, dto.coordinates.lat]
              },
              typeDto, // 👈 підставляємо отриманий об’єкт типу
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
              dto.lastVerifiedBy,
              dto.updatedBy,
              dto.rejectionReason

            );
          })
        )
      )
    );
  }


  getUserPendingLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}locations/me/pending-locations/`);
  }

  updateLocationFromPending(locationId: string, pendingCopyId: number, data: any) {
    return this.http.put(
      `${this.baseUrl}locations/${locationId}/pending_copy/${pendingCopyId}`,
      data
    );
  }

  updateDuplicateFromLocation(locationId: string, duplicateId: string, data: any) {
    return this.http.put(
      `${this.baseUrl}locations/${locationId}/duplicate/${duplicateId}`,
      data
    );
  }

  getPendingLocationsByLocationId(locationId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}locations/${locationId}/pending-locations/`)
  }

  getUserPendingLocationsByLocationId(locationId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}locations/me/${locationId}/pending-locations/`)
  }


  getLocations(): Observable<Location[]> {
    console.log('method called')
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
            dto.lastVerifiedBy,
            dto.updatedBy,
            dto.rejectionReason
          );
        })
      )
    );
  }

  rejectPending(pendingId: number, message: string) {
    const dto = { rejectionReason: message };
    return this.http.patch(
      `${this.baseUrl}locations/pending/${pendingId}/`,
      dto
    );
  }





  getAllPendingLocations(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}locations/pending-locations`);
  }

  updateLocation(id: string, data: any) {
    return this.http.put<Location>(`${this.baseUrl}locations/${id}`, data);
  }

  getUserModifiedLocations() {
    return this.http.get<any>(`${this.baseUrl}locations/me/`).pipe(
      map(res =>
        res.map((dto: any) => {
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
            dto.rejectionReason,
            dto.updatedBy,
            dto.lastVerifiedBy
          );
        })
      )
    );
  }

  getUserPendingCopyByLocationId(locationId: string) {
    return this.http.get(`${this.baseUrl}locations/me/${locationId}/pending`);
  }

}
