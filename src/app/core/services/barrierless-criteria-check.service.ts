import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';
import { BarrierlessCriteriaCheckCreateDto } from '../core/../dtos/check-scope/barrierless-criteria-check-create-dto';

@Injectable({ providedIn: 'root' })
export class BarrierlessCriteriaCheckService {
  private baseUrl = `${environment.apiEndpoint}/api/`;

  private baseUrlImage = `${environment.apiStorageEndpoint}`;

  constructor(private http: HttpClient) {}

  /*
  saveAll(checkList: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}barrier-criteria-check/all`, checkList);
  }
    */

  saveAll(formData: BarrierlessCriteriaCheckCreateDto[]): Observable<any> {
  return this.http.post(`${this.baseUrl}barrier-criteria-check/all`, formData);
}

upload(formData: FormData): Observable<any> {
  return this.http.post(`${this.baseUrlImage}images/upload`, formData);
}

uploadAllCheckImages(locationId: string, imageId: string, formData: FormData): Observable<any> {
  return this.http.post(
    `${this.baseUrlImage}/locations/${locationId}/check/image/${imageId}/all`,
    formData
  );
}

getCheckImages(location_id: string): Observable<string[]> {
  const params = { type: 'CHECK' };

  return this.http.get<string[]>(
    `${this.baseUrlImage}/locations/${location_id}/image/url`,
    { params }
  );
}

deleteCheckImage(locationId: string, checkImageId: string, imageId: string) {
  return this.http.delete(
    `${this.baseUrlImage}/locations/${locationId}/check/${checkImageId}/image/${imageId}`
  );
}

}
