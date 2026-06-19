import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IPlantingSpotPrimitives } from '@contexts/planting-spots/domain/primitives/planting-spot.primitives';
import { PlantingSpotCapacityValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-capacity/planting-spot-capacity.value-object';
import { PlantingSpotColumnValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-column/planting-spot-column.value-object';
import { PlantingSpotDescriptionValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-description/planting-spot-description.value-object';
import { PlantingSpotDimensionsValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-dimensions/planting-spot-dimensions.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotRowValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-row/planting-spot-row.value-object';
import { PlantingSpotSoilTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-soil-type/planting-spot-soil-type.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

export type CreatePlantingSpotCommandInput = Omit<
  IPlantingSpotPrimitives,
  'id' | 'createdAt' | 'updatedAt'
>;

export class CreatePlantingSpotCommand {
  public readonly name: PlantingSpotNameValueObject;
  public readonly type: PlantingSpotTypeValueObject;
  public readonly description: PlantingSpotDescriptionValueObject | null;
  public readonly capacity: PlantingSpotCapacityValueObject | null;
  public readonly row: PlantingSpotRowValueObject | null;
  public readonly column: PlantingSpotColumnValueObject | null;
  public readonly dimensions: PlantingSpotDimensionsValueObject | null;
  public readonly soilType: PlantingSpotSoilTypeValueObject | null;
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
    this.capacity =
      input.capacity != null
        ? new PlantingSpotCapacityValueObject(input.capacity)
        : null;
    this.row =
      input.row != null ? new PlantingSpotRowValueObject(input.row) : null;
    this.column =
      input.column != null
        ? new PlantingSpotColumnValueObject(input.column)
        : null;
    this.dimensions =
      input.dimensionsWidth != null ||
      input.dimensionsHeight != null ||
      input.dimensionsLength != null
        ? new PlantingSpotDimensionsValueObject({
            width: input.dimensionsWidth,
            height: input.dimensionsHeight,
            length: input.dimensionsLength,
          })
        : null;
    this.soilType =
      input.soilType != null
        ? new PlantingSpotSoilTypeValueObject(input.soilType)
        : null;
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
