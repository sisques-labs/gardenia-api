import { BasePrimitives } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';

export interface IPlantIdentificationPhotoPrimitives {
  fileId: string;
  url: string;
  organ: PlantIdentificationOrganEnum;
  position: number;
}

export interface IPlantIdentificationCandidatePrimitives {
  scientificName: string;
  commonNames: string[];
  score: number;
  rank: number;
}

export type IPlantIdentificationPrimitives = BasePrimitives & {
  requestedByUserId: string;
  spaceId: string;
  status: PlantIdentificationStatusEnum;
  resolvedSpeciesKey: number | null;
  resolvedScientificName: string | null;
  resolvedSpeciesProvider: string | null;
  convertedToPlantId: string | null;
  photos: IPlantIdentificationPhotoPrimitives[];
  candidates: IPlantIdentificationCandidatePrimitives[];
};
