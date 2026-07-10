import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import {
  GbifSpeciesSuggestion,
  IGbifSpeciesSearchPort,
} from '@contexts/plant-species/application/ports/gbif-species-search.port';

import { GbifSpeciesSuggestResponse } from './gbif/types/gbif-suggest-api.types';

const GBIF_BASE_URL = 'https://api.gbif.org/v1';
const REQUEST_TIMEOUT_MS = 5000;

@Injectable()
export class GbifSpeciesSuggestAdapter implements IGbifSpeciesSearchPort {
  private readonly logger = new Logger(GbifSpeciesSuggestAdapter.name);

  constructor(private readonly httpService: HttpService) {}

  async suggest(name: string, limit: number): Promise<GbifSpeciesSuggestion[]> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<GbifSpeciesSuggestResponse>(
          `${GBIF_BASE_URL}/species/suggest`,
          {
            params: { q: name, limit, rank: 'SPECIES' },
            timeout: REQUEST_TIMEOUT_MS,
          },
        ),
      );

      return (data ?? [])
        .map((item) => this.toSuggestion(item))
        .filter((item): item is GbifSpeciesSuggestion => item != null);
    } catch (error) {
      this.logger.warn(`GBIF species suggest failed for "${name}": ${error}`);
      return [];
    }
  }

  private toSuggestion(item: {
    key?: number;
    scientificName?: string;
    canonicalName?: string;
  }): GbifSpeciesSuggestion | null {
    const scientificName = (
      item.canonicalName ??
      item.scientificName ??
      ''
    ).trim();

    if (!scientificName || item.key == null) {
      return null;
    }

    return { gbifKey: item.key, scientificName };
  }
}
