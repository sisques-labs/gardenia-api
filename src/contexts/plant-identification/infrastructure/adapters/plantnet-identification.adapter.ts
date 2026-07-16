import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

import { PlantNetIdentificationCandidateResult } from '@contexts/plant-identification/application/ports/plantnet-identification-candidate.result';
import { PlantNetIdentificationImageInput } from '@contexts/plant-identification/application/ports/plantnet-identification-image.input';
import { IPlantNetIdentificationPort } from '@contexts/plant-identification/application/ports/plantnet-identification.port';
import { PlantIdentificationProviderUnavailableException } from '@contexts/plant-identification/domain/exceptions/plant-identification-provider-unavailable.exception';
import { PlantIdentificationQuotaExceededException } from '@contexts/plant-identification/domain/exceptions/plant-identification-quota-exceeded.exception';
import {
  PlantNetConfig,
  plantnetConfig,
} from '@contexts/plant-identification/infrastructure/config/plantnet.config';

import { PlantNetIdentifyApiResponse } from './plantnet/types/plantnet-identify-api.types';

const PLANTNET_BASE_URL = 'https://my-api.plantnet.org/v2/identify';

/**
 * `POST /v2/identify/{project}` — PlantNet's multi-image, multi-organ
 * identification endpoint. Sends every submitted photo in ONE request (see
 * design.md's "one PlantNet request per identification, not per photo"
 * decision).
 *
 * ⚠️ See `plantnet/types/plantnet-identify-api.types.ts` for a prominent
 * disclaimer: the response shape this adapter parses is UNVERIFIED against a
 * live call (Phase 0 task 0.2 was not performed — no real API key was
 * available to this implementation). Confirm before shipping to production.
 */
@Injectable()
export class PlantNetIdentificationAdapter implements IPlantNetIdentificationPort {
  private readonly logger = new Logger(PlantNetIdentificationAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(plantnetConfig.KEY)
    private readonly config: PlantNetConfig,
  ) {}

  async identify(
    images: PlantNetIdentificationImageInput[],
    project?: string,
  ): Promise<PlantNetIdentificationCandidateResult[]> {
    const resolvedProject = project || this.config.project;

    this.logger.log(
      `Calling PlantNet identify: project=${resolvedProject}, images=${images.length}`,
    );

    const formData = new FormData();
    for (const image of images) {
      formData.append('organs', image.organ);
      formData.append(
        'images',
        new Blob([new Uint8Array(image.content)], {
          type: image.mimeType.value,
        }),
        'photo',
      );
    }

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<PlantNetIdentifyApiResponse>(
          `${PLANTNET_BASE_URL}/${resolvedProject}`,
          formData,
          {
            params: { 'api-key': this.config.apiKey },
            timeout: this.config.timeoutMs,
          },
        ),
      );

      this.logger.log(
        `PlantNet identify completed: ${data.results?.length ?? 0} candidate(s)`,
      );

      return (data.results ?? []).map((result) => ({
        scientificName: result.species.scientificNameWithoutAuthor,
        commonNames: result.species.commonNames ?? [],
        score: result.score,
      }));
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapError(error: unknown): Error {
    const axiosError = error as AxiosError;
    const status = axiosError?.response?.status;

    if (status === 429) {
      this.logger.warn('PlantNet identify rejected: quota exceeded (429)');
      return new PlantIdentificationQuotaExceededException();
    }

    const reason =
      status != null
        ? `HTTP ${status}`
        : axiosError?.message || 'unknown error';
    this.logger.error(`PlantNet identify failed: ${reason}`);
    return new PlantIdentificationProviderUnavailableException(reason);
  }
}
