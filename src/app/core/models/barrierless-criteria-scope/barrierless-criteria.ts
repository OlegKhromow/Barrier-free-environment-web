import { BarrierlessCriteriaType } from './barrierless-criteria-type';

export class BarrierlessCriteria {
  constructor(
    public id: string, // UUID
    public name: string,
    public description: string,
    public barrierlessCriteriaType: BarrierlessCriteriaType,
    public createdBy: string, // UUID
    public createdAt: string, // ISO date string
    public updatedAt: string  // ISO date string
  ) {}
}
