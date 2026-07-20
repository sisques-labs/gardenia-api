import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { IdentifyPlantResolvedResult } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant-resolved.result';
import { PlantNetIdentificationCandidateResult } from '@contexts/plant-identification/application/ports/plantnet-identification-candidate.result';
import {
  IPlantSpeciesPort,
  PLANT_SPECIES_PORT,
} from '@contexts/plant-identification/application/ports/plant-species.port';
import { PlantIdentificationScoreValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-score/plant-identification-score.value-object';

/** Mirrors `PLANTNET_MIN_CONFIDENCE`'s documented default in `.env.example`. */
const DEFAULT_MIN_CONFIDENCE = 0.2;

export interface ResolvePlantSpeciesMatchServiceInput {
  topCandidate: PlantNetIdentificationCandidateResult | undefined;
}

/**
 * Auto-resolves the top candidate against `plant-species` when confident
 * enough — `meetsThreshold()` is the domain rule for "what counts as
 * confident", not a bare comparison here.
 */
@Injectable()
export class ResolvePlantSpeciesMatchService implements IBaseService<
  ResolvePlantSpeciesMatchServiceInput,
  IdentifyPlantResolvedResult | null
> {
  private readonly minConfidence: number;

  constructor(
    @Inject(PLANT_SPECIES_PORT)
    private readonly plantSpeciesPort: IPlantSpeciesPort,
    configService: ConfigService,
  ) {
    this.minConfidence = configService.get<number>(
      'plantnet.minConfidence',
      DEFAULT_MIN_CONFIDENCE,
    );
  }

  async execute(
    input: ResolvePlantSpeciesMatchServiceInput,
  ): Promise<IdentifyPlantResolvedResult | null> {
    const { topCandidate } = input;
    if (
      !topCandidate ||
      !new PlantIdentificationScoreValueObject(
        topCandidate.score,
      ).meetsThreshold(this.minConfidence)
    ) {
      return null;
    }

    const matches = await this.plantSpeciesPort.search(
      topCandidate.scientificName,
      1,
    );
    const bestMatch = matches[0];
    if (!bestMatch) {
      return null;
    }

    return {
      speciesKey: bestMatch.speciesKey,
      scientificName: bestMatch.scientificName,
      provider: bestMatch.provider,
    };
  }
}
