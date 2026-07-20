import { IdentifyPlantResolvedResult } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant-resolved.result';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import {
  IPlantIdentificationCandidatePrimitives,
  IPlantIdentificationPhotoPrimitives,
} from '@contexts/plant-identification/domain/primitives/plant-identification.primitives';

/**
 * Result of {@link IdentifyPlantCommand}: the persisted identification
 * attempt, including its full PlantNet result.
 */
export interface IdentifyPlantResult {
  id: string;
  status: PlantIdentificationStatusEnum;
  resolved: IdentifyPlantResolvedResult | null;
  candidates: IPlantIdentificationCandidatePrimitives[];
  photos: IPlantIdentificationPhotoPrimitives[];
  createdAt: Date;
}
