import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Location } from '../models/location';

@Injectable({ providedIn: 'root' })
export class LocationStore {

  private locationsSubject = new BehaviorSubject<Location[] | null>(null);
  locations$ = this.locationsSubject.asObservable();

  setLocations(locations: Location[]) {
    this.locationsSubject.next(locations);
  }

  clear() {
    this.locationsSubject.next(null);
  }
}
