import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  GbifSpeciesSuggestion,
  GBIF_SPECIES_SEARCH_PORT,
  IGbifSpeciesSearchPort,
} from '@contexts/plant-species/application/ports/gbif-species-search.port';

import { GbifSpeciesSearchQuery } from './gbif-species-search.query';

@QueryHandler(GbifSpeciesSearchQuery)
export class GbifSpeciesSearchQueryHandler implements IQueryHandler<GbifSpeciesSearchQuery> {
  private readonly logger = new Logger(GbifSpeciesSearchQueryHandler.name);

  constructor(
    @Inject(GBIF_SPECIES_SEARCH_PORT)
    private readonly gbifSpeciesSearchPort: IGbifSpeciesSearchPort,
  ) {}

  async execute(
    query: GbifSpeciesSearchQuery,
  ): Promise<GbifSpeciesSuggestion[]> {
    this.logger.log(`Searching GBIF species: name=${query.name}`);

    return this.gbifSpeciesSearchPort.suggest(query.name, query.limit);
  }
}
