import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import {
  IPlantIdentificationCandidatePrimitives,
  IPlantIdentificationPhotoPrimitives,
  IPlantIdentificationPrimitives,
} from '@contexts/plant-identification/domain/primitives/plant-identification.primitives';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';

export class PlantIdentificationViewModel extends BaseViewModel {
  public readonly requestedByUserId: string;
  public readonly spaceId: string;
  public readonly status: PlantIdentificationStatusEnum;
  public readonly resolvedGbifKey: number | null;
  public readonly resolvedScientificName: string | null;
  public readonly convertedToPlantId: string | null;
  public readonly photos: IPlantIdentificationPhotoPrimitives[];
  public readonly candidates: IPlantIdentificationCandidatePrimitives[];

  constructor(props: IPlantIdentificationPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.requestedByUserId = props.requestedByUserId;
    this.spaceId = props.spaceId;
    this.status = props.status;
    this.resolvedGbifKey = props.resolvedGbifKey;
    this.resolvedScientificName = props.resolvedScientificName;
    this.convertedToPlantId = props.convertedToPlantId;
    this.photos = props.photos;
    this.candidates = props.candidates;
  }
}
