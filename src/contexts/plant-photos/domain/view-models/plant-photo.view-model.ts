import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IPlantPhotoPrimitives } from '@contexts/plant-photos/domain/primitives/plant-photo.primitives';

export class PlantPhotoViewModel extends BaseViewModel {
  public readonly plantId: string;
  public readonly fileId: string;
  public readonly url: string;
  public readonly userId: string;
  public readonly spaceId: string;

  constructor(props: IPlantPhotoPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.plantId = props.plantId;
    this.fileId = props.fileId;
    this.url = props.url;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
