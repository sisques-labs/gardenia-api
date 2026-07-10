import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantSpeciesPrimitives } from '@contexts/plant-species/domain/primitives/plant-species.primitives';

export class PlantSpeciesViewModel extends BaseViewModel {
  public readonly scientificName: string;
  public readonly gbifKey: number | null;

  constructor(props: IPlantSpeciesPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.scientificName = props.scientificName;
    this.gbifKey = props.gbifKey;
  }
}
