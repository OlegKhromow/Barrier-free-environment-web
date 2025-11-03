import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {BehaviorSubject, catchError, map, Observable, of, Subject, switchMap, tap, throwError} from 'rxjs';
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
          localStorage.setItem('refresh_token', response.refreshToken);
          this.isLoggedInSubject.next(true);
        })
      );
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
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

  registerUser(user: any): Observable<string> {
    return this.http.post(`${this.apiUrl}/users/`, user, {
      responseType: 'text' // <-- ключове
    });
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

  isAccessNotExpired(): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/validate/access`);
  }

  isRefreshNotExpired(): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/validate/refresh`);
  }

  refreshToken() {
    return this.http.post<{ refreshToken: string, accessToken: string }>(`${this.apiUrl}/refresh_token`, {})
      .pipe(
        tap((response) => {
          localStorage.setItem('auth_token', response.accessToken);
          localStorage.setItem('refresh_token', response.refreshToken);
          this.isLoggedInSubject.next(true);
        })
      );
  }


  ensureValidSession(): Observable<void> {
    // 1️⃣ Якщо користувач не залогінений — нічого не робимо
    if (!this.isLoggedIn()) {
      return of(void 0);
    }

    // 2️⃣ Перевіряємо access токен
    return this.isAccessNotExpired().pipe(
      switchMap((accessValid) => {
        if (accessValid) {
          // ✅ Access токен ще живий
          return of(void 0);
        }

        // ⚠️ Access протух → перевіряємо refresh
        return this.isRefreshNotExpired().pipe(
          switchMap((refreshValid) => {
            if (refreshValid) {
              // 🔁 Refresh ще живий → оновлюємо токени
              return this.refreshToken().pipe(map(() => void 0));
            } else {
              // ❌ Refresh теж протух → виходимо із системи
              this.logout();
              return throwError(() => new Error('Session expired'));
            }
          })
        );
      })
    );
  }


}
