import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {Location} from '../models/location';
import {LocationType} from '../models/location-type';
import {LocationStatusEnum} from '../models/location-status-enum';
import {Contacts} from '../models/contacts';
import {DayHours, WorkingHours} from '../models/working-hours';
import {BarrierlessCriteriaType} from '../models/barrierless-criteria-scope/barrierless-criteria-type';
import {environment} from '../../../../enviroments/enviroment';
import {HttpClient} from '@angular/common/http';
import {BarrierlessCriteriaGroup} from '../models/barrierless-criteria-scope/barrierless-criteria-group';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private baseUrl = `${environment.apiEndpoint}/api/locations`;

  constructor(private http: HttpClient) {
  }


  getLocations(): Observable<Location[]> {
    // return this.http.get<any[]>(`${this.baseUrl}/`).pipe(
    //   map(dataArray =>
    //     dataArray.map(data => new Location(
    //       data.id,
    //       data.name,
    //       data.address,
    //       data.coordinates,
    //       data.type,
    //       data.description,
    //       data.contacts,
    //       data.workingHours,
    //       data.createdBy,
    //       data.organizationId,
    //       data.status,
    //       data.overallAccessibilityScore,
    //       data.createdAt,
    //       data.updatedAt,
    //       data.lastVerifiedAt,
    //       data.rejectionReason
    //     ))
    //   )
    // );

    // Приклад групи критеріїв
    const defaultGroup = new BarrierlessCriteriaGroup(
      'group1',
      'Загальна група критеріїв',
      'Група для базових критеріїв доступності',
      [], // locationTypes
      [new BarrierlessCriteriaType(
        '1',
        'Загальний критерій',
        'Критерій доступності',
        null,
        [], // barrierlessCriterias
        'admin',
        new Date().toISOString(),
        new Date().toISOString()
      )], // barrierlessCriteriaTypes
      'admin',
      new Date().toISOString(),
      new Date().toISOString()
    );

// Приклад типу
    const defaultType = new LocationType(
      '1',
      'Публічне місце',
      'Місця загального користування',
      [],
      defaultGroup,
      'admin',
      new Date().toISOString(),
      new Date().toISOString()
    );

// Приклад робочих годин
    const workingHours = new WorkingHours(
      new DayHours('09:00', '18:00'),
      new DayHours('09:00', '18:00'),
      new DayHours('09:00', '18:00'),
      new DayHours('09:00', '18:00'),
      new DayHours('09:00', '18:00'),
      null,
      null
    );

// Фіктивні локації Чернігова
    const locations: Location[] = [
      new Location(
        'loc1',
        'Центральна площа',
        'вул. Кирпоноса, Чернігів',
        {type: 'Point', coordinates: [51.4910, 31.2986]}, // довгота, широта
        defaultType,
        'Головна площа міста',
        new Contacts('0462-123456', 'info@chernigiv.ua', 'https://chernigiv.ua'),
        workingHours,
        'admin',
        null,
        LocationStatusEnum.PUBLISHED,
        90,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        null
      ),
      new Location(
        'loc2',
        'Парк ім. Попудренка',
        'вул. Шевченка, Чернігів',
        {type: 'Point', coordinates: [51.4904, 31.2971]},
        defaultType,
        'Великий міський парк',
        new Contacts('0462-654321', null, null),
        workingHours,
        'admin',
        null,
        LocationStatusEnum.PENDING,
        80,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        null
      ),
      new Location(
        'loc3',
        'Вокзал Чернігів',
        'вул. Івана Мазепи, Чернігів',
        {type: 'Point', coordinates: [51.4859, 31.2672]},
        defaultType,
        'Залізничний вокзал',
        new Contacts(null, 'info@chernigivtrain.ua', null),
        workingHours,
        'admin',
        null,
        LocationStatusEnum.DRAFT,
        70,
        new Date().toISOString(),
        new Date().toISOString(),
        new Date().toISOString(),
        null
      )
    ];

    return of(locations);

  }
}
