import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotDescriptionValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

export interface CreatePlantingSpotCommandInput {
  name: string;
  type: PlantingSpotTypeEnum;
  description?: string | null;
  userId: string;
  spaceId: string;
}

export class CreatePlantingSpotCommand {
  public readonly name: PlantingSpotNameValueObject;
  public readonly type: PlantingSpotTypeValueObject;
  public readonly description: PlantingSpotDescriptionValueObject | null;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: CreatePlantingSpotCommandInput) {
    this.name = new PlantingSpotNameValueObject(input.name);
    this.type = new PlantingSpotTypeValueObject(input.type);
    this.description =
      input.description != null
        ? new PlantingSpotDescriptionValueObject(input.description)
        : null;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
