import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import {
  IPlantSpeciesImportPort,
  PlantSpeciesImportRecord,
} from '@contexts/plant-species/application/ports/plant-species-import.port';
import { PlantSpeciesDescriptionValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-description/plant-species-description.value-object';
import { PlantSpeciesImageUrlValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-image-url/plant-species-image-url.value-object';

import {
  GbifMediaResponse,
  GbifSpeciesMatchResponse,
  GbifSpeciesResponse,
  GbifSpeciesSearchResponse,
  GbifSpeciesSearchResult,
} from './gbif/types/gbif-api.types';

const GBIF_BASE_URL = 'https://api.gbif.org/v1';
const REQUEST_TIMEOUT_MS = 5000;
const VASCULAR_PLANTS_TAXON_KEY = 7707728;

@Injectable()
export class GbifPlantSpeciesImportAdapter implements IPlantSpeciesImportPort {
  private readonly logger = new Logger(GbifPlantSpeciesImportAdapter.name);

  constructor(private readonly httpService: HttpService) {}

  async fetchByScientificName(
    scientificName: string,
  ): Promise<PlantSpeciesImportRecord | null> {
    try {
      const match = await this.getSpeciesMatch(scientificName);
      if (!match?.usageKey || match.matchType === 'NONE') {
        return null;
      }

      const resolvedName = (
        match.canonicalName ??
        match.scientificName ??
        scientificName
      ).trim();
      if (!resolvedName) {
        return null;
      }

      const { description, imageUrl } = await this.enrichFromUsageKey(
        match.usageKey,
      );
      if (description == null && imageUrl == null) {
        return null;
      }

      return { scientificName: resolvedName, description, imageUrl };
    } catch (error) {
      this.logger.warn(
        `GBIF enrichment lookup failed for "${scientificName}": ${error}`,
      );
      return null;
    }
  }

  async fetchPage(
    limit: number,
    offset: number,
  ): Promise<PlantSpeciesImportRecord[]> {
    try {
      const searchResults = await this.searchSpecies(limit, offset);
      const records = await Promise.all(
        searchResults.map((item) => this.toImportRecord(item)),
      );

      return records.filter(
        (record): record is PlantSpeciesImportRecord => record != null,
      );
    } catch (error) {
      this.logger.warn(`GBIF import page failed: ${error}`);
      return [];
    }
  }

  private async getSpeciesMatch(
    scientificName: string,
  ): Promise<GbifSpeciesMatchResponse | null> {
    const { data } = await firstValueFrom(
      this.httpService.get<GbifSpeciesMatchResponse>(
        `${GBIF_BASE_URL}/species/match`,
        {
          params: { name: scientificName },
          timeout: REQUEST_TIMEOUT_MS,
        },
      ),
    );

    return data;
  }

  private async searchSpecies(
    limit: number,
    offset: number,
  ): Promise<GbifSpeciesSearchResult[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<GbifSpeciesSearchResponse>(
        `${GBIF_BASE_URL}/species/search`,
        {
          params: {
            rank: 'SPECIES',
            status: 'ACCEPTED',
            highertaxon_key: VASCULAR_PLANTS_TAXON_KEY,
            limit,
            offset,
          },
          timeout: REQUEST_TIMEOUT_MS,
        },
      ),
    );

    return data.results ?? [];
  }

  private async toImportRecord(
    item: GbifSpeciesSearchResult,
  ): Promise<PlantSpeciesImportRecord | null> {
    const scientificName = (
      item.canonicalName ??
      item.scientificName ??
      ''
    ).trim();
    if (!scientificName || item.key == null) {
      return null;
    }

    try {
      const { description, imageUrl } = await this.enrichFromUsageKey(item.key);
      return { scientificName, description, imageUrl };
    } catch (error) {
      this.logger.warn(
        `GBIF enrichment failed for "${scientificName}": ${error}`,
      );
      return { scientificName, description: null, imageUrl: null };
    }
  }

  private async enrichFromUsageKey(usageKey: number): Promise<{
    description: string | null;
    imageUrl: string | null;
  }> {
    const [species, media] = await Promise.all([
      this.getSpecies(usageKey),
      this.getSpeciesMedia(usageKey),
    ]);

    return {
      description: this.extractDescription(species),
      imageUrl: this.extractImageUrl(media),
    };
  }

  private async getSpecies(usageKey: number): Promise<GbifSpeciesResponse> {
    const { data } = await firstValueFrom(
      this.httpService.get<GbifSpeciesResponse>(
        `${GBIF_BASE_URL}/species/${usageKey}`,
        { timeout: REQUEST_TIMEOUT_MS },
      ),
    );

    return data;
  }

  private async getSpeciesMedia(
    usageKey: number,
  ): Promise<GbifMediaResponse | null> {
    const { data } = await firstValueFrom(
      this.httpService.get<GbifMediaResponse>(
        `${GBIF_BASE_URL}/species/${usageKey}/media`,
        {
          params: { limit: 1 },
          timeout: REQUEST_TIMEOUT_MS,
        },
      ),
    );

    return data;
  }

  private extractDescription(species: GbifSpeciesResponse): string | null {
    const englishDescription = species.descriptions?.find(
      (entry) =>
        entry.language?.toLowerCase().startsWith('en') && entry.description,
    )?.description;

    if (englishDescription) {
      return this.truncate(
        englishDescription,
        PlantSpeciesDescriptionValueObject.MAX_LENGTH,
      );
    }

    const englishVernacular = species.vernacularNames?.find(
      (entry) =>
        entry.language?.toLowerCase().startsWith('en') && entry.vernacularName,
    )?.vernacularName;

    return englishVernacular
      ? this.truncate(
          englishVernacular,
          PlantSpeciesDescriptionValueObject.MAX_LENGTH,
        )
      : null;
  }

  private extractImageUrl(media: GbifMediaResponse | null): string | null {
    const identifier = media?.results?.[0]?.identifier;
    if (!identifier) return null;

    return this.truncate(
      identifier,
      PlantSpeciesImageUrlValueObject.MAX_LENGTH,
    );
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }
}
