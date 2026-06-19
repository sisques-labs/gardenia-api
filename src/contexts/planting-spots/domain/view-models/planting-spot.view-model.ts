import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPrimitives } from '../primitives/planting-spot.primitives';

export class PlantingSpotViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly type: string;
  public readonly description: string | null;
  public readonly capacity: number | null;
  public readonly row: number | null;
  public readonly column: number | null;
  public readonly dimensionsWidth: number | null;
  public readonly dimensionsHeight: number | null;
  public readonly dimensionsLength: number | null;
  public readonly soilType: string | null;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: IPlantingSpotPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.type = props.type;
    this.description = props.description;
    this.capacity = props.capacity;
    this.row = props.row;
    this.column = props.column;
    this.dimensionsWidth = props.dimensionsWidth;
    this.dimensionsHeight = props.dimensionsHeight;
    this.dimensionsLength = props.dimensionsLength;
    this.soilType = props.soilType;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
