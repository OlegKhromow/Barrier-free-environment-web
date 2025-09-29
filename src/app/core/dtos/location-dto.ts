import {WorkingHours} from '../models/working-hours';
import {Contacts} from '../models/contacts';

export interface LocationDto {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  type: string;
  description: string | null;
  contacts: Contacts;
  workingHours: WorkingHours;
  createdBy: string;
  organizationId: string | null;
  status: string;
  overallAccessibilityScore: number | null;
  createdAt: string;
  updatedAt: string;
  lastVerifiedAt: string;
  rejectionReason: string | null;
}
