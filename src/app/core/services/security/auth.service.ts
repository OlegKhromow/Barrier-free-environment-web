import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {BehaviorSubject, Observable, Subject, tap} from 'rxjs';
import {UserDTO} from '../../dtos/user-dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl: string = environment.apiEndpoint;

  private loginModalSubject = new Subject<boolean>();
  loginModal$ = this.loginModalSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private baseUrl = `${environment.apiEndpoint}`;

  constructor(private http: HttpClient) {
    const hasToken = !!this.getToken();
    this.isLoggedInSubject.next(hasToken);
  }

  login(username: string, password: string) {
    return this.http.post<{ refreshToken: string, accessToken: string }>(`${this.apiUrl}/login`, {username, password})
      .pipe(
        tap((response) => {
          localStorage.setItem('auth_token', response.accessToken);
          this.isLoggedInSubject.next(true);
        })
      );
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.isLoggedInSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/`);
  }

  getUserByUsername(username: string): Observable<UserDTO> {
    return this.http.get<UserDTO>(`${this.apiUrl}/users/username/${username}`);
  }

  deleteUser(username: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${username}`);
  }

  updateUserRole(username: string, newRole: string): Observable<UserDTO> {
    return this.http.patch<UserDTO>(`${this.apiUrl}/users/username/${username}/role`, { role: newRole });
  }


  isLoggedIn(): boolean {
    const isLogged = !!this.getToken();
    this.isLoggedInSubject.next(isLogged);
    return isLogged;
  }

  openLoginModal() {
    this.loginModalSubject.next(true);
  }

  closeLoginModal() {
    this.loginModalSubject.next(false);
  }

  getByUsername(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/me/`);
  }

  getAuthoritiesByUsername(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/me/authorities`);
  }
}
