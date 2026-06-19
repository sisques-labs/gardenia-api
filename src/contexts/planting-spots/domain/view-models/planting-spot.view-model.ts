import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantingSpotPrimitives } from '../primitives/planting-spot.primitives';
import { PlantingSpotPlantViewModel } from './planting-spot-plant.view-model';

export class PlantingSpotViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly type: string;
  public readonly description: string | null;
  public readonly capacity: number | null;
  public readonly row: number | null;
  public readonly column: number | null;
  public readonly dimensions: string | null;
  public readonly soilType: string | null;
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly resolvedPlants: PlantingSpotPlantViewModel[];

  constructor(
    props: IPlantingSpotPrimitives & {
      resolvedPlants?: PlantingSpotPlantViewModel[];
    },
  ) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.type = props.type;
    this.description = props.description;
    this.capacity = props.capacity;
    this.row = props.row;
    this.column = props.column;
    this.dimensions = props.dimensions;
    this.soilType = props.soilType;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
    this.resolvedPlants = props.resolvedPlants ?? [];
  }
}
