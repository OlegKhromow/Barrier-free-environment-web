export interface LocationCreateDTO {
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type: string; // UUID у вигляді рядка
  description?: string;
  contacts?: any;       // зроби інтерфейси під Contacts, WorkingHours якщо треба
  workingHours?: any;
  createdBy: string;    // UUID як рядок
  organizationId?: string;
  status?: string;      // Enum як рядок
  overallAccessibilityScore?: number;
  createdAt?: string;   // ISO строки
  updatedAt?: string;
  lastVerifiedAt: string;
  rejectionReason?: string;
}
