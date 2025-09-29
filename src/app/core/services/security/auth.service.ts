import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {BehaviorSubject, Subject, tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl: string = environment.apiEndpoint;

  private loginModalSubject = new Subject<boolean>();
  loginModal$ = this.loginModalSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  login(username: string, password: string) {
    return this.http.post<{ refreshToken: string, accessToken: string }>(`${this.apiUrl}/login`, {username, password})
      .pipe(
        tap((response: { refreshToken: string, accessToken: string }) => {
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

  isLoggedIn(): boolean {
    const isLogged: boolean = !!this.getToken();
    this.isLoggedInSubject.next(isLogged);
    return isLogged;
  }

  openLoginModal() {
    this.loginModalSubject.next(true);
  }

  closeLoginModal() {
    this.loginModalSubject.next(false);
  }
}
