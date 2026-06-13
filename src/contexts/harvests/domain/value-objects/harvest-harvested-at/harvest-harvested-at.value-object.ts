import { DateValueObject } from '@sisques-labs/nestjs-kit';

export class HarvestHarvestedAtValueObject extends DateValueObject {
  constructor(value: Date) {
    super(value);
  }
}
