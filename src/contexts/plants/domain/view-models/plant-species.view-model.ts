import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantSpeciesViewModelPrimitives } from '../primitives/plant-species-view-model.primitives';

export class PlantSpeciesViewModel extends BaseViewModel {
  public readonly name: string;

  constructor(props: IPlantSpeciesViewModelPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
  }
}
