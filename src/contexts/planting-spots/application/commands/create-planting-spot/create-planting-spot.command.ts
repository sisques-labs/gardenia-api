import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';
import { PlantingSpotDescriptionValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

export type CreatePlantingSpotCommandInput = Omit<
  IPlantingSpotPrimitives,
  'id' | 'createdAt' | 'updatedAt' | 'description'
> &
  Partial<Pick<IPlantingSpotPrimitives, 'description'>>;

export class CreatePlantingSpotCommand {
  public readonly name: PlantingSpotNameValueObject;
  public readonly type: PlantingSpotTypeValueObject;
  public readonly description: PlantingSpotDescriptionValueObject | null;
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: CreatePlantingSpotCommandInput) {
    this.name = new PlantingSpotNameValueObject(input.name);
    this.type = new PlantingSpotTypeValueObject(
      input.type as PlantingSpotTypeEnum,
    );
    this.description =
      input.description != null
        ? new PlantingSpotDescriptionValueObject(input.description)
        : null;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
