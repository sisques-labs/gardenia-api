import {
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IPlantIdentificationCandidate } from '@contexts/plant-identification/domain/interfaces/plant-identification-candidate.interface';
import { IPlantIdentificationPhoto } from '@contexts/plant-identification/domain/interfaces/plant-identification-photo.interface';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';

export interface IPlantIdentification {
  id: PlantIdentificationIdValueObject;
  requestedByUserId: UuidValueObject;
  spaceId: UuidValueObject;
  status: PlantIdentificationStatusValueObject;
  resolvedGbifKey: NumberValueObject | null;
  resolvedScientificName: StringValueObject | null;
  convertedToPlantId: UuidValueObject | null;
  photos: IPlantIdentificationPhoto[];
  candidates: IPlantIdentificationCandidate[];
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
