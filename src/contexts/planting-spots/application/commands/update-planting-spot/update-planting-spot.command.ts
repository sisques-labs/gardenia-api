import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';
import { PlantingSpotDescriptionValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

export type UpdatePlantingSpotCommandInput = Pick<
  IPlantingSpotPrimitives,
  'spaceId' | 'id'
> & {
  requestingUserId: string;
} & Partial<
    Omit<
      IPlantingSpotPrimitives,
      'id' | 'spaceId' | 'userId' | 'createdAt' | 'updatedAt'
    >
  >;

export class UpdatePlantingSpotCommand {
  public readonly id: PlantingSpotIdValueObject;
  public readonly name: PlantingSpotNameValueObject | undefined;
  public readonly type: PlantingSpotTypeValueObject | undefined;
  public readonly description:
    | PlantingSpotDescriptionValueObject
    | null
    | undefined;
  public readonly requestingUserId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: UpdatePlantingSpotCommandInput) {
    this.id = new PlantingSpotIdValueObject(input.id);
    this.name = input.name
      ? new PlantingSpotNameValueObject(input.name)
      : undefined;
    this.type = input.type
      ? new PlantingSpotTypeValueObject(input.type as PlantingSpotTypeEnum)
      : undefined;
    this.description =
      input.description !== undefined
        ? input.description != null
          ? new PlantingSpotDescriptionValueObject(input.description)
          : null
        : undefined;
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
