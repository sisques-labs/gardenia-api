import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { IPlantSpeciesPort } from '@contexts/plant-identification/application/ports/plant-species.port';
import { PlantSpeciesMatch } from '@contexts/plant-identification/application/ports/plant-species-match.interface';
import {
  GbifSpeciesSearchQuery,
  GbifSpeciesSearchQueryInput,
} from '@contexts/plant-species/application/queries/gbif-species-search/gbif-species-search.query';
import { GbifSpeciesSuggestion } from '@contexts/plant-species/application/ports/gbif-species-search.port';

/** This adapter is the ONLY place in `plant-identification` allowed to know
 * the species search behind `IPlantSpeciesPort` is GBIF-backed today — the
 * port, the application handler, and the domain aggregate only ever see the
 * provider-neutral `PlantSpeciesMatch` shape (`speciesKey`/`provider`). If
 * `plant-species` ever adds a second catalog, only this mapping changes. */
const GBIF_PROVIDER = 'gbif';

@Injectable()
export class PlantSpeciesAdapter implements IPlantSpeciesPort {
  private readonly logger = new Logger(PlantSpeciesAdapter.name);

  constructor(private readonly queryBus: QueryBus) {}

  async search(name: string, limit: number): Promise<PlantSpeciesMatch[]> {
    this.logger.log(`Resolving PlantNet candidate against GBIF: ${name}`);

    const input: GbifSpeciesSearchQueryInput = { name, limit };
    const results = await this.queryBus.execute<
      GbifSpeciesSearchQuery,
      GbifSpeciesSuggestion[]
    >(new GbifSpeciesSearchQuery(input));

    return results.map((result) => ({
      speciesKey: result.gbifKey,
      scientificName: result.scientificName,
      provider: GBIF_PROVIDER,
    }));
  }
}
