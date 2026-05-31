import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantSpeciesPrimitives } from '@contexts/plant-species/domain/primitives/plant-species.primitives';

export class PlantSpeciesViewModel extends BaseViewModel {
  public readonly name: string;

  constructor(props: IPlantSpeciesPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
  }
}
