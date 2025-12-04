import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private messageSource = new BehaviorSubject<string | null>(null);
  message$ = this.messageSource.asObservable();

  open(message: string) {
    this.messageSource.next(message);
  }

  close() {
    this.messageSource.next(null);
  }
}
