import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';
import { PlantingSpotCapacityValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-capacity/planting-spot-capacity.value-object';
import { PlantingSpotColumnValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-column/planting-spot-column.value-object';
import { PlantingSpotDescriptionValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotDimensionsValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-dimensions/planting-spot-dimensions.value-object';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotRowValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-row/planting-spot-row.value-object';
import { PlantingSpotSoilTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-soil-type/planting-spot-soil-type.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

export type UpdatePlantingSpotCommandInput = Pick<
  IPlantingSpotPrimitives,
  'id' | 'spaceId'
> & {
  requestingUserId: string;
} & Partial<
    Omit<
      IPlantingSpotPrimitives,
      'id' | 'userId' | 'spaceId' | 'createdAt' | 'updatedAt'
    >
  >;

export class UpdatePlantingSpotCommand {
  public readonly id: PlantingSpotIdValueObject;
  public readonly name: PlantingSpotNameValueObject | undefined;
  public readonly type: PlantingSpotTypeValueObject | undefined;
  public readonly description: PlantingSpotDescriptionValueObject | null | undefined;
  public readonly capacity: PlantingSpotCapacityValueObject | null | undefined;
  public readonly row: PlantingSpotRowValueObject | null | undefined;
  public readonly column: PlantingSpotColumnValueObject | null | undefined;
  public readonly dimensions: PlantingSpotDimensionsValueObject | null | undefined;
  public readonly soilType: PlantingSpotSoilTypeValueObject | null | undefined;
  public readonly requestingUserId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: UpdatePlantingSpotCommandInput) {
    this.id = new PlantingSpotIdValueObject(input.id);
    this.name = input.name ? new PlantingSpotNameValueObject(input.name) : undefined;
    this.type = input.type
      ? new PlantingSpotTypeValueObject(input.type as PlantingSpotTypeEnum)
      : undefined;
    this.description =
      input.description !== undefined
        ? input.description != null
          ? new PlantingSpotDescriptionValueObject(input.description)
          : null
        : undefined;
    this.capacity =
      input.capacity !== undefined
        ? input.capacity != null
          ? new PlantingSpotCapacityValueObject(input.capacity)
          : null
        : undefined;
    this.row =
      input.row !== undefined
        ? input.row != null
          ? new PlantingSpotRowValueObject(input.row)
          : null
        : undefined;
    this.column =
      input.column !== undefined
        ? input.column != null
          ? new PlantingSpotColumnValueObject(input.column)
          : null
        : undefined;

    const hasDimensionsChange =
      input.dimensionsWidth !== undefined ||
      input.dimensionsHeight !== undefined ||
      input.dimensionsLength !== undefined;
    this.dimensions = hasDimensionsChange
      ? input.dimensionsWidth != null ||
        input.dimensionsHeight != null ||
        input.dimensionsLength != null
        ? new PlantingSpotDimensionsValueObject({
            width: input.dimensionsWidth ?? null,
            height: input.dimensionsHeight ?? null,
            length: input.dimensionsLength ?? null,
          })
        : null
      : undefined;

    this.soilType =
      input.soilType !== undefined
        ? input.soilType != null
          ? new PlantingSpotSoilTypeValueObject(input.soilType)
          : null
        : undefined;
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
