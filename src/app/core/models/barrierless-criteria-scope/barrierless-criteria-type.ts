import { BarrierlessCriteriaGroup } from './barrierless-criteria-group';
import { BarrierlessCriteria } from './barrierless-criteria';

export class BarrierlessCriteriaType {
  constructor(
    public id: string, // UUID
    public name: string,
    public description: string,
    public barrierlessCriteriaGroup: BarrierlessCriteriaGroup | null, // ManyToOne
    public barrierlessCriterias: BarrierlessCriteria[], // OneToMany
    public createdBy: string, // UUID
    public createdAt: string, // ISO date string
    public updatedAt: string  // ISO date string
  ) {}
}
