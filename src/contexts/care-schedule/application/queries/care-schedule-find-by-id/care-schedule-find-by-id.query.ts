import { ICareSchedulePrimitives } from '@contexts/care-schedule/domain/primitives/care-schedule.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type CareScheduleFindByIdQueryInput = Pick<
  ICareSchedulePrimitives,
  'id'
>;

export class CareScheduleFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: CareScheduleFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}
