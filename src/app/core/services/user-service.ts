import { Injectable } from '@angular/core';
import {environment} from '../../../environments/environment';
import { UserStatistics } from '../dtos/user-scope/user-statistics';
import {HttpClient, HttpResponse} from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  
   private baseUrl = `${environment.apiEndpoint}/users`;

  constructor(private http: HttpClient) {}

getUserStatistics() {
  return this.http.get<UserStatistics>(`${this.baseUrl}/statistic`);
}

}
