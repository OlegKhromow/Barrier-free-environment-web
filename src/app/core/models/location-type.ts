import { Location } from './location';
import { BarrierlessCriteriaGroup } from './barrierless-criteria-scope/barrierless-criteria-group';

export class LocationType {
  constructor(
    public id: string, // UUID
    public name: string,
    public description: string,
    public locations: Location[], // OneToMany
    public barrierlessCriteriaGroup: BarrierlessCriteriaGroup, // ManyToOne
    public createdBy: string, // UUID
    public createdAt: string, // ISO date string
    public updatedAt: string  // ISO date string
  ) {}
}
