import { HttpService } from '@nestjs/axios';
import { MimeTypeValueObject } from '@sisques-labs/nestjs-kit';
import { AxiosError, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationProviderUnavailableException } from '@contexts/plant-identification/domain/exceptions/plant-identification-provider-unavailable.exception';
import { PlantIdentificationQuotaExceededException } from '@contexts/plant-identification/domain/exceptions/plant-identification-quota-exceeded.exception';
import { PlantNetConfig } from '@contexts/plant-identification/infrastructure/config/plantnet.config';
import { PlantNetIdentifyApiResponse } from './plantnet/types/plantnet-identify-api.types';
import { PlantNetIdentificationAdapter } from './plantnet-identification.adapter';

const CONFIG: PlantNetConfig = {
  apiKey: 'test-api-key',
  project: 'all',
  minConfidence: 0.2,
  timeoutMs: 15_000,
};

const IMAGE = {
  content: Buffer.from('leaf-bytes'),
  mimeType: new MimeTypeValueObject('image/png'),
  organ: PlantIdentificationOrganEnum.LEAF,
};

const axiosResponse = (
  data: PlantNetIdentifyApiResponse,
): AxiosResponse<PlantNetIdentifyApiResponse> =>
  ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  }) as AxiosResponse<PlantNetIdentifyApiResponse>;

function axiosErrorWithStatus(status: number): AxiosError {
  const error = new Error('request failed') as AxiosError;
  error.isAxiosError = true;
  error.response = {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {} as never,
  } as AxiosResponse;
  return error;
}

describe('PlantNetIdentificationAdapter', () => {
  let httpService: jest.Mocked<HttpService>;
  let adapter: PlantNetIdentificationAdapter;

  beforeEach(() => {
    httpService = { post: jest.fn() } as unknown as jest.Mocked<HttpService>;
    adapter = new PlantNetIdentificationAdapter(httpService, CONFIG);
  });

  it('maps a successful response into scientificName/commonNames/score candidates', async () => {
    httpService.post.mockReturnValue(
      of(
        axiosResponse({
          results: [
            {
              score: 0.85,
              species: {
                scientificNameWithoutAuthor: 'Monstera deliciosa',
                commonNames: ['Swiss cheese plant'],
              },
            },
          ],
        }),
      ),
    );

    const result = await adapter.identify([IMAGE]);

    expect(result).toEqual([
      {
        scientificName: 'Monstera deliciosa',
        commonNames: ['Swiss cheese plant'],
        score: 0.85,
      },
    ]);
  });

  it('returns an empty array when PlantNet returns no results', async () => {
    httpService.post.mockReturnValue(of(axiosResponse({ results: [] })));

    const result = await adapter.identify([IMAGE]);

    expect(result).toEqual([]);
  });

  it('defaults missing commonNames to an empty array', async () => {
    httpService.post.mockReturnValue(
      of(
        axiosResponse({
          results: [
            { score: 0.5, species: { scientificNameWithoutAuthor: 'X' } },
          ],
        }),
      ),
    );

    const result = await adapter.identify([IMAGE]);

    expect(result[0].commonNames).toEqual([]);
  });

  it('throws PlantIdentificationQuotaExceededException on a 429 response', async () => {
    httpService.post.mockReturnValue(
      throwError(() => axiosErrorWithStatus(429)),
    );

    await expect(adapter.identify([IMAGE])).rejects.toThrow(
      PlantIdentificationQuotaExceededException,
    );
  });

  it('throws PlantIdentificationProviderUnavailableException on a 5xx response', async () => {
    httpService.post.mockReturnValue(
      throwError(() => axiosErrorWithStatus(503)),
    );

    await expect(adapter.identify([IMAGE])).rejects.toThrow(
      PlantIdentificationProviderUnavailableException,
    );
  });

  it('throws PlantIdentificationProviderUnavailableException on a timeout/network error', async () => {
    const error = new Error('timeout of 15000ms exceeded') as AxiosError;
    error.isAxiosError = true;
    httpService.post.mockReturnValue(throwError(() => error));

    await expect(adapter.identify([IMAGE])).rejects.toThrow(
      PlantIdentificationProviderUnavailableException,
    );
  });

  it('sends the configured project in the request URL, defaulting from config', async () => {
    httpService.post.mockReturnValue(of(axiosResponse({ results: [] })));

    await adapter.identify([IMAGE]);

    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining('/v2/identify/all'),
      expect.anything(),
      expect.objectContaining({
        params: { 'api-key': CONFIG.apiKey },
        timeout: CONFIG.timeoutMs,
      }),
    );
  });

  it('uses an explicit project override over the config default', async () => {
    httpService.post.mockReturnValue(of(axiosResponse({ results: [] })));

    await adapter.identify([IMAGE], 'weurope');

    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining('/v2/identify/weurope'),
      expect.anything(),
      expect.anything(),
    );
  });

  it('sends every image in a single request (multi-photo)', async () => {
    httpService.post.mockReturnValue(of(axiosResponse({ results: [] })));

    await adapter.identify([
      IMAGE,
      { ...IMAGE, organ: PlantIdentificationOrganEnum.FLOWER },
    ]);

    expect(httpService.post).toHaveBeenCalledTimes(1);
  });
});
