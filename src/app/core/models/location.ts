import { LocationType } from './location-type';
import { Contacts } from './contacts';
import { WorkingHours } from './working-hours';
import { LocationStatusEnum } from './location-status-enum';

export class Location {
  constructor(
    public id: string, // UUID
    public name: string,
    public address: string,
    public coordinates: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    },
    public type: LocationType,
    public description: string | null,
    public contacts: Contacts,
    public workingHours: WorkingHours,
    public createdBy: string, // UUID
    public organizationId: string | null, // UUID
    public status: LocationStatusEnum,
    public overallAccessibilityScore: number | null,
    public createdAt: string,   // ISO date string
    public updatedAt: string,   // ISO date string
    public lastVerifiedAt: string, // ISO date string
    public rejectionReason: string | null
  ) {}

  public get latitude(): number {
    return this.coordinates.coordinates[0];
  }

  public get longitude(): number {
    return this.coordinates.coordinates[1];
  }
}
