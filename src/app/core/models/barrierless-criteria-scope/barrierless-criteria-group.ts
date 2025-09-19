import { LocationType } from '../location-type';
import { BarrierlessCriteriaType } from './barrierless-criteria-type';

export class BarrierlessCriteriaGroup {
  constructor(
    public id: string, // UUID
    public name: string,
    public description: string,
    public locationTypes: LocationType[], // OneToMany
    public barrierlessCriteriaTypes: BarrierlessCriteriaType[], // OneToMany
    public createdBy: string, // UUID
    public createdAt: string, // ISO date string
    public updatedAt: string  // ISO date string
  ) {}
}
