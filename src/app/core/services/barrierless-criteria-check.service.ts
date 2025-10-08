import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BarrierlessCriteriaCheckService {
  private baseUrl = `${environment.apiEndpoint}/api/`;

  constructor(private http: HttpClient) {}

  saveAll(checkList: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}barrier-criteria-check/all`, checkList);
  }
}
