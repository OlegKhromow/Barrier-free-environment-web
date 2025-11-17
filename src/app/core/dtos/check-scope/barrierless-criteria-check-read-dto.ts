export interface BarrierlessCriteriaCheckReadDto {
  locationId: string;
  barrierlessCriteriaId: string;
  userId: string;
  comment: string | null;
  hasIssue: boolean;
  barrierFreeRating: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  imageServiceId: string;
}
